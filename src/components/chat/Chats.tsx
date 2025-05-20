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
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
}

interface Message {
  senderEmail: string;
  message: string;
  timestamp: string;
}

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:8080";
const socket = io(SERVER, { transports: ["websocket"] });

const Chats: React.FC<ChatsProps> = ({ rideId, otherName, sendEncryptedData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function parseJwt(token: string): { email?: string; userType?: string } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g,'+').replace(/_/g,'/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  const rawToken = localStorage.getItem("jwt") || "";
  const payload  = parseJwt(rawToken) || {};
  const userEmail = payload.email || null;
  const userRole  = payload.userType || null;
  const userName  = userRole === "admin" ? "Administrator" : "Ty";

  useEffect(() => {
    // fetch historii:
    fetch(`${SERVER}/chats/${rideId}/history`, {
      headers: { Authorization: `Bearer ${rawToken}` }
    })
      .then(r => r.json())
      .then(history => {
        setMessages(history);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .catch(err => console.error("fetch chat history:", err));

    // dołącz do pokoju:
    socket.emit("joinRoom", { rideId });

    // nasłuchiwanie:
    socket.on("receiveMessage", (msg: Message) => {
      if (msg.senderEmail === userEmail) return;
      setMessages(prev => [...prev, msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [rideId, rawToken, userEmail]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !userEmail) return;

    const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
    const msg: Message = { senderEmail: userEmail, message: text, timestamp: ts };

    // od razu wyświetlamy lokalnie
    setMessages(prev => [...prev, msg]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    // emitujemy przez socket, backend zapisze do bazy
    socket.emit("sendMessage", { rideId, senderEmail: userEmail, message: text });

    setInput("");
  };

  return (
    <IonPage className="chat-page">
      <IonHeader>
        <IonToolbar className={userRole === "admin" ? "toolbar-admin" : ""}>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            {otherName} — czat przejazdu #{rideId}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        <IonList>
          {messages.map((msg, idx) => {
            const mine = msg.senderEmail === userEmail;
            // wybór klasy dla bąbelka:
            const bubbleClass = mine
              ? (userRole === "admin" ? "chat-bubble admin" : "chat-bubble mine")
              : "chat-bubble other";

            return (
              <IonItem key={idx} className={bubbleClass}>
                <div>
                  <div>{msg.message}</div>
                  <div className="bubble-meta">
                    {mine ? userName : otherName}{" "}
                    {msg.timestamp.slice(0, 16).replace("T", " ")}
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
          onKeyUp={e => e.key === "Enter" && sendMessage()}
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
