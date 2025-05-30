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
} from "@ionic/react";

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

const ChatList: React.FC<ChatListProps> = ({ handlePageChange, getEncryptedData }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data: ChatRoom[] = await getEncryptedData("chats");
        setRooms(data);
      } catch (e) {
        console.error("Błąd pobierania czatów:", e);
      } finally {
        setBusy(false);
      }
    })();
  }, [getEncryptedData]);

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
              onClick={() => handlePageChange("Chat", { rideId, otherName })}
            >
              <IonCardHeader>
                <IonCardTitle className="chat-card-title">
                  CZAT: {otherName} <span className="chat-ride-badge">Przejazd nr: {rideId}</span>
                </IonCardTitle>
                <div className="chat-card-date">
                 Data przejazdu: {new Date(data_zamowienia).toLocaleDateString()}
                </div>
              </IonCardHeader>
            </IonCard>
          ))}
          {!busy && rooms.length === 0 && (
            <div className="no-chats">Brak aktywnych rozmów</div>
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default ChatList;