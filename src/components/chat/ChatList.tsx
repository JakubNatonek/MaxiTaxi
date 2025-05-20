import React, { useEffect, useState } from "react";
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
  IonButton,
  IonIcon,
  IonAlert,
} from "@ionic/react";
import { trashOutline } from "ionicons/icons";
import "./chat.css";

interface ChatRoom {
  rideId: number;
  data_zamowienia: string;
  otherName: string;
}

interface ChatListProps {
  handlePageChange: (page: string, params?: any) => void;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:8080";

const ChatList: React.FC<ChatListProps> = ({ handlePageChange, getEncryptedData }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [busy, setBusy] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("jwt") || "";

  const fetchChats = async () => {
    setBusy(true);
    try {
      const data: ChatRoom[] = await getEncryptedData("chats");
      setRooms(data);
    } catch (e) {
      console.error("Błąd pobierania czatów:", e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const confirmDelete = async (reason: string) => {
    if (!deleteId) return;
    try {
      await fetch(`${SERVER}/chats/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      await fetchChats();
    } catch (e) {
      console.error("Błąd podczas usuwania czatu:", e);
    } finally {
      setShowDeleteAlert(false);
      setDeleteId(null);
      setDeleteReason("");
    }
  };

  return (
    <IonPage className="chat-list-page">
      <IonHeader>
        <IonToolbar className="orange-bar">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Lista Czatów</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={busy} message="Ładowanie..." />

        <IonList>
          {rooms.map(({ rideId, data_zamowienia, otherName }) => (
            <IonCard
              key={rideId}
              className="chat-card"
              button
              onClick={() =>
                handlePageChange("Chat", { rideId, otherName })
              }
            >
              <IonCardHeader>
                <IonCardTitle className="chat-card-title">
                  CZAT: {otherName}{" "}
                  <span className="chat-ride-badge">Przejazd nr: {rideId}</span>
                </IonCardTitle>
                <div className="chat-card-date">
                  Data przejazdu:{" "}
                  {new Date(data_zamowienia).toLocaleDateString()}
                </div>
              </IonCardHeader>

              {role === "admin" && (
                <IonButton
                  fill="clear"
                  color="danger"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // nie otwieraj pokoju
                    setDeleteId(rideId);
                    setShowDeleteAlert(true);
                  }}
                >
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              )}
            </IonCard>
          ))}

          {!busy && rooms.length === 0 && (
            <div className="no-chats">Brak aktywnych rozmów</div>
          )}
        </IonList>

        <IonAlert
          isOpen={showDeleteAlert}
          header="Powód usunięcia czatu"
          inputs={[
            {
              name: "reason",
              type: "text",
              placeholder: "np. spam, duplikat itp.",
            },
          ]}
          buttons={[
            {
              text: "Anuluj",
              role: "cancel",
              handler: () => setShowDeleteAlert(false),
            },
            {
              text: "Usuń",
              handler: (data) => confirmDelete(data.reason || ""),
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ChatList;
