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
  IonText,
} from "@ionic/react";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "../../JwtPayLoad";
import "./chat.css";

interface Message {
  senderEmail: string;
  message: string;
  timestamp: string;
}

interface ChatsProps {
  rideId: number;
  otherName: string;
}

const SERVER = import.meta.env.VITE_REACT_APP_API_URL!;
const SECRET_KEY = import.meta.env.VITE_REACT_APP_SECRET_KEY!;
const socket = io(SERVER, { transports: ["websocket"] });

const Chats: React.FC<ChatsProps> = ({ rideId, otherName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatStatus, setChatStatus] = useState<number>(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Decode JWT for user info
  const token = localStorage.getItem("jwt") || "";
  let userEmail = "";
  let userRole = 0;
  let userName = "";
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    userEmail = decoded.email;
    userRole = typeof decoded.roleId === "string" ? parseInt(decoded.roleId, 10) : decoded.roleId;
    userName = userRole === 1 ? "Administrator" : "Ty";
  } catch {}

  // AES-CBC key import for decrypting history
  const importKey = async () =>
    crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET_KEY),
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );

  // Decrypt encrypted history data
  const decryptData = async (iv: number[], data: number[]): Promise<Message[]> => {
    const key = await importKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as Message[];
  };

  useEffect(() => {
    // Fetch and set chat status
    (async () => {
      try {
        const res = await fetch(`${SERVER}/chats/${rideId}`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        setChatStatus(Number(body.status));
      } catch (e) {
        console.error("Error fetching chat status:", e);
      }
    })();

    // Fetch and decrypt history
    (async () => {
      try {
        const res = await fetch(`${SERVER}/chats/${rideId}/history`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        let hist: Message[] = [];
        if (body.iv && body.data) {
          hist = await decryptData(body.iv, body.data);
        } else if (Array.isArray(body.messages)) {
          hist = body.messages;
        }
        setMessages(hist);
      } catch (err) {
        console.error("Error fetching chat history:", err);
      } finally {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    })();

    // Join room and listen for new messages only when open
    socket.emit("joinRoom", { rideId });
    if (chatStatus === 1) {
      socket.on("receiveMessage", (msg: Message) => {
        setMessages(prev => [...prev, msg]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }

    return () => {
      socket.emit("leaveRoom", { rideId });
      socket.off("receiveMessage");
    };
  }, [rideId, chatStatus, token]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || chatStatus !== 1) return;
    const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
    const msg: Message = { senderEmail: userEmail, message: text, timestamp: ts };
    setMessages(prev => [...prev, msg]);
    socket.emit("sendMessage", { rideId, senderEmail: userEmail, message: text });
    setInput("");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <IonPage className="chat-page">
      <IonHeader>
        <IonToolbar className={userRole === 1 ? "toolbar-admin" : ""}>
          <IonButtons slot="start"><IonMenuButton/></IonButtons>
          <IonTitle>{otherName} — czat przejazdu #{rideId}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        {chatStatus === 3 && (
          <div className="ion-padding">
            <IonText color="danger">Czat został zamknięty przez administratora.</IonText>
          </div>
        )}
        {chatStatus === 2 && (
          <div className="ion-padding">
            <IonText color="medium">Przejazd zakończony – tryb tylko do odczytu.</IonText>
          </div>
        )}

        <IonList>
          {messages.map((msg, idx) => {
            const mine = msg.senderEmail === userEmail;
            const bubbleClass = mine
              ? userRole === 1
                ? "chat-bubble admin"
                : "chat-bubble mine"
              : "chat-bubble other";
            return (
              <IonItem key={idx} className={bubbleClass} lines="none">
                <div>
                  <div>{msg.message}</div>
                  <div className="bubble-meta">
                    {mine ? userName : otherName} {msg.timestamp}
                  </div>
                </div>
              </IonItem>
            );
          })}
          <div ref={bottomRef} />
        </IonList>

        {chatStatus === 1 && (
          <div className="chat-input-wrapper">
            <IonInput
              value={input}
              placeholder="Napisz wiadomość..."
              onIonInput={e => setInput(e.detail.value!)}
              onKeyUp={e => e.key === "Enter" && sendMessage()}
              className="chat-input"
            />
            <IonButton onClick={sendMessage} disabled={!input.trim()} className="chat-send-btn">Wyślij</IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Chats;
