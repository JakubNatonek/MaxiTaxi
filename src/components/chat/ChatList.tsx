import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { io, Socket } from "socket.io-client";
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

const ChatList: React.FC<ChatListProps> = ({ handlePageChange, getEncryptedData }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Wyciągnięcie roleId z JWT
  const token = localStorage.getItem("jwt") || "";
  let roleId = 0;
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
    roleId = typeof payload.roleId === "string" ? parseInt(payload.roleId, 10) : payload.roleId;
  } catch {}

  // Funkcja fetchChats
  const fetchChats = useCallback(async () => {
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
      setRooms(data.map(r => ({ ...r, status: Number(r.status) })));
    } catch (e) {
      console.error("fetchChats error:", e);
    } finally {
      setLoading(false);
    }
  }, [roleId, token, getEncryptedData]);

  // Socket.io + subskrypcja na eventy
  useEffect(() => {
    const sock = io(SERVER, {
      transports: ["websocket"],
      auth: { token },
    });

    setSocket(sock);

    sock.on("connect", () => {
      console.log("Socket connected:", sock.id);
      if (roleId === 1) {
        // dołącz do pokoju adminów
        sock.emit("join", "adminChats");
      }
    });

    sock.on("chatCreated", fetchChats);

    // najpierw pobierz chaty od razu po mount
    fetchChats();

    return () => {
      sock.off("chatCreated", fetchChats);
      sock.disconnect();
    };
  }, [fetchChats, roleId, token]);

  // Dla admina tylko unikalne rideId
  const displayRooms = useMemo(() => {
    if (roleId !== 1) return rooms;
    const map = new Map<number, ChatRoom>();
    rooms.forEach(r => {
      const ex = map.get(r.rideId);
      if (!ex || new Date(r.data_zamowienia) > new Date(ex.data_zamowienia)) {
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
      // po zmianie powiadom innych adminów
      socket?.emit("chatCreated");
    } catch (e) {
      console.error("changeStatus error:", e);
    }
  };

  const listToRender = roleId === 1 ? displayRooms : rooms;

  return (
    <IonPage className="chat-list-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Lista Czatów</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={loading} message="Ładowanie..." />
        <IonList>
          {listToRender.map(room => {
            const statusLabel =
              room.status === 1
                ? "Otwarty"
                : room.status === 2
                ? "Zakończony"
                : "Zamknięty";
            const statusColor =
              room.status === 1 ? "success" : room.status === 2 ? "warning" : "danger";
            return (
              <IonCard
                key={room.rideId}
                className="chat-card"
                button={roleId === 1 || room.status !== 3}
                onClick={() =>
                  handlePageChange("Chat", {
                    rideId: room.rideId,
                    otherName: room.otherName,
                  })
                }
              >
                <IonCardHeader className="chat-card-header" style={{ position: "relative", padding: "16px" }}>
                  <div>
                    <IonCardTitle className="chat-with-title">
                      Czat z: {room.otherName}
                    </IonCardTitle>
                    <div className="chat-card-date">
                      {new Date(room.data_zamowienia).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ position: "absolute", top: "12px", right: "12px", textAlign: "right" }}>
                    <IonBadge color={statusColor}>{statusLabel}</IonBadge>
                    <div className="chat-ride-badge">Czat nr: {room.rideId}</div>
                  </div>
                </IonCardHeader>
                {roleId === 1 && (
                  <IonSelect
                    interface="action-sheet"
                    interfaceOptions={{ cssClass: "chatlist-select-sheet" }}
                    value={room.status}
                    placeholder="Zmień status"
                    onClick={e => e.stopPropagation()}
                    onIonChange={e => {
                      e.stopPropagation();
                      changeStatus(room.rideId, e.detail.value);
                    }}
                  >
                    <IonSelectOption value={1}>Otwarty</IonSelectOption>
                    <IonSelectOption value={2}>Zakończony</IonSelectOption>
                    <IonSelectOption value={3}>Zamknięty</IonSelectOption>
                  </IonSelect>
                )}
              </IonCard>
            );
          })}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default ChatList;
