import React, { useEffect, useMemo, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonLoading,
  IonBadge,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { JwtPayload } from "../../JwtPayLoad";
import "./chat.css";

interface ChatRoom {
  rideId: number;
  data_zamowienia: string;
  otherName: string;
  status: number; // 1=otwarty, 2=zakończony, 3=zamknięty
}

interface ChatListProps {
  handlePageChange: (page: string, params?: any) => void;
  getEncryptedData: (endpoint: string) => Promise<ChatRoom[]>;
}

const SERVER = import.meta.env.VITE_REACT_APP_API_URL!;
const token = localStorage.getItem("jwt") || "";

const ChatList: React.FC<ChatListProps> = ({ handlePageChange, getEncryptedData }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Decode roleId from JWT
  let roleId = 0;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
    roleId = typeof payload.roleId === "string" ? parseInt(payload.roleId, 10) :	payload.roleId;
  } catch {}

  const fetchChats = async () => {
    setLoading(true);
    try {
      let data: ChatRoom[];
      if (roleId === 1) {
        const res = await fetch(`${SERVER}/admin/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = await res.json();
      } else {
        data = await getEncryptedData("chats");
      }
      setRooms(
        data.map(r => ({
          ...r,
          status: Number(r.status),
        }))
      );
    } catch (e) {
      console.error("fetchChats error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Admin: group by rideId to show one entry per chat number
  const displayRooms = useMemo(() => {
    if (roleId !== 1) return rooms;
    const map = new Map<number, ChatRoom>();
    rooms.forEach(r => {
      const existing = map.get(r.rideId);
      if (!existing || new Date(r.data_zamowienia) > new Date(existing.data_zamowienia)) {
        map.set(r.rideId, r);
      }
    });
    return Array.from(map.values());
  }, [rooms, roleId]);

  const changeStatus = async (rideId: number, status: number) => {
    try {
      await fetch(`${SERVER}/admin/chats/${rideId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      await fetchChats();
    } catch (e) {
      console.error("changeStatus error:", e);
    }
  };

  const listToRender = roleId === 1 ? displayRooms : rooms;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonMenuButton /></IonButtons>
          <IonTitle>Lista Czatów</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={loading} message="Ładowanie..." />
        <IonList>
          {listToRender.map(room => (
            <IonCard
              key={room.rideId}
              button={roleId === 1 || room.status !== 3}
              onClick={() => handlePageChange("Chat", { rideId: room.rideId, otherName: room.otherName })}
            >
              <IonCardHeader>
                <IonBadge
                  color={
                    room.status === 1 ? "success" :
                    room.status === 2 ? "medium" :
                    "danger"
                  }
                >
                  {room.status === 1 ? "Otwarty" : room.status === 2 ? "Zakończony" : "Zamknięty"}
                </IonBadge>
                <IonCardTitle>
                  {room.otherName}
                </IonCardTitle>
                <div className="chat-ride-badge">Czat nr: {room.rideId}</div>
                <div className="chat-card-date">{new Date(room.data_zamowienia).toLocaleDateString()}</div>
              </IonCardHeader>

              {roleId === 1 && (
                <IonSelect
                  value={room.status}
                  placeholder="Zmień status"
                  onIonChange={e => changeStatus(room.rideId, e.detail.value)}
                >
                  <IonSelectOption value={1}>Otwarty</IonSelectOption>
                  <IonSelectOption value={2}>Zakończony</IonSelectOption>
                  <IonSelectOption value={3}>Zamknięty</IonSelectOption>
                </IonSelect>
              )}
            </IonCard>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default ChatList;
