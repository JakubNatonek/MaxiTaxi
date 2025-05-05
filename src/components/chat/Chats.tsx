import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
} from "@ionic/react";
import { io } from "socket.io-client";
import "./chat.css";

interface ChatsProps {
  rideId: number;
  otherName: string;
}

interface Message {
  senderEmail: string;
  message: string;
  timestamp: string;
}

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:8080";
const socket = io(SERVER, { transports: ["websocket"] });

const Chats: React.FC<ChatsProps> = ({ rideId, otherName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const getUserEmail = (): string | null => {
    const token = localStorage.getItem("jwt");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.email;
    } catch {
      return null;
    }
  };
  const userEmail = getUserEmail();

  useEffect(() => {
    socket.on("chatHistory", (history: Message[]) => {
      setMessages(history);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    socket.on("receiveMessage", (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    socket.emit("joinRoom", { rideId });

    return () => {
      socket.off("chatHistory");
      socket.off("receiveMessage");
    };
  }, [rideId]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !userEmail) return;

    const ts = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const msg: Message = {
      senderEmail: userEmail,
      message: text,
      timestamp: ts,
    };

    setMessages(prev => [...prev, msg]);

    socket.emit("sendMessage", { rideId, senderEmail: userEmail, message: text });

    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <IonPage className="chat-page">
      <IonHeader>
        <IonToolbar className="orange-bar">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            {otherName}Czat przejazdu {rideId}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        <IonList>
          {messages.map((msg, idx) => {
            const mine = msg.senderEmail === userEmail;
            return (
              <IonItem
                key={idx}
                className={mine ? "chat-bubble mine" : "chat-bubble other"}
              >
                <div>
                  <div>{msg.message}</div>
                  <div className="bubble-meta">
                    {mine ? "Ty" : otherName} {msg.timestamp.slice(0,16).replace("T"," ")}
                  </div>
                </div>
              </IonItem>
            );
          })}
          <div ref={bottomRef} />
        </IonList>
      </IonContent>

      <div className="chat-input-wrapper">
        <IonInput
          value={input}
          placeholder="Napisz wiadomość..."
          onIonChange={e => setInput(e.detail.value!)}
          onKeyUp={e => { if (e.key === "Enter") sendMessage(); }}
          className="chat-input"
        />
        <IonButton
          onClick={sendMessage}
          disabled={!input.trim()}
          className="chat-send-btn"
        >
          Wyślij
        </IonButton>
      </div>
    </IonPage>
  );
};

export default Chats;
