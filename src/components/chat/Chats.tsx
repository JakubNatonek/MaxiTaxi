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

import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "../../JwtPayLoad";

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

const SERVER =
  import.meta.env.VITE_REACT_APP_API_URL;
const socket = io(SERVER, { transports: ["websocket"] });

const Chats: React.FC<ChatsProps> = ({
  rideId,
  otherName,
  sendEncryptedData,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem("jwt");

  let userEmail = null;
  let userRole = null;
  let userName = "";

  if (token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      // console.log(decoded);
      userEmail = decoded.email;
      userRole = decoded.roleId;
      userName = userRole === 1 ? "Administrator" : "Ty";
      // userType = decoded.userType;
    } catch (err) {
      console.error("Błąd dekodowania tokena:", err);
    }
  }

  useEffect(() => {
    socket.on("chatHistory", (history: Message[]) => {
      setMessages(history);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    });
    socket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    });

    socket.emit("joinRoom", { rideId });

    return () => {
      socket.off("chatHistory");
      socket.off("receiveMessage");
    };
  }, [rideId]);

  useEffect(() => {
    // fetch historii:
    fetch(`${SERVER}/chats/${rideId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((history) => {
        setMessages(history);
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          50
        );
      })
      .catch((err) => console.error("fetch chat history:", err));

    // dołącz do pokoju:
    socket.emit("joinRoom", { rideId });

    // nasłuchiwanie:
    socket.on("receiveMessage", (msg: Message) => {
      if (msg.senderEmail === userEmail) return;
      setMessages((prev) => [...prev, msg]);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [rideId, token, userEmail]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !userEmail) return;

    const ts = new Date().toISOString().slice(0, 19).replace("T", " ");
    const msg: Message = {
      senderEmail: userEmail,
      message: text,
      timestamp: ts,
    };

    // od razu wyświetlamy lokalnie
    setMessages((prev) => [...prev, msg]);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    // emitujemy przez socket, backend zapisze do bazy
    socket.emit("sendMessage", {
      rideId,
      senderEmail: userEmail,
      message: text,
    });

    setInput("");
  };

  return (
     <IonPage className="chat-page">
      <IonHeader>
        <IonToolbar className={userRole === 1 ? "toolbar-admin" : ""}>
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
              ? (userRole === 1 ? "chat-bubble admin" : "chat-bubble mine")
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
