import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
<<<<<<< HEAD
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
=======
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonText,
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
} from "@ionic/react";
import { io } from "socket.io-client";
import "./chat.css";

<<<<<<< HEAD
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
=======
const socket = io("http://127.0.0.1:8080");

const Chat: React.FC = () => {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState<string[]>([]);
  const [status, setStatus] = useState<"waiting" | "connecting" | "connected" | "error">("waiting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const isInitiator = useRef(false);

  useEffect(() => {
    socket.on("connect", () => {
      setStatus("connecting");
    });

    socket.on("role", ({ type }) => {
      isInitiator.current = type === "init";

      setTimeout(() => {
        startWebRTC();
      }, 300);
    });

    socket.on("offer", async (offer) => {
      const pc = peerConnection.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", answer);
    });

    socket.on("answer", async (answer) => {
      const pc = peerConnection.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async (candidate) => {
      const pc = peerConnection.current;
      if (!pc) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      // socket.disconnect();
    };
  }, []);

  const startWebRTC = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    pc.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      setupChannel(event.channel);
    };

    if (isInitiator.current) {
      const channel = pc.createDataChannel("chat");
      dataChannel.current = channel;
      setupChannel(channel);

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (pc.localDescription) {
            socket.emit("offer", pc.localDescription);
          }
        });
    }
  };

  const setupChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      setStatus("connected");
    };

    channel.onmessage = (event) => {
      setChatLog((prev) => [...prev, `Partner: ${event.data}`]);
    };

    channel.onerror = () => {
      setStatus("error");
      setErrorMessage("Wystąpił błąd kanału danych.");
    };

    channel.onclose = () => {
      setStatus("error");
      setErrorMessage("Kanał został zamknięty.");
    };
  };

  const sendMessage = () => {
    const channel = dataChannel.current;
    if (channel && channel.readyState === "open") {
      channel.send(message);
      setChatLog((prev) => [...prev, `Ty: ${message}`]);
      setMessage("");
    } else {
      setErrorMessage("Nie można wysłać wiadomości. Kanał niegotowy.");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Czat</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="chat-container">
          <IonText>
            <h3>Wiadomości</h3>
          </IonText>

          <IonText color={status === "connected" ? "success" : "warning"}>
            <p style={{ marginBottom: "10px" }}>
              {status === "connected"
                ? "Połączono"
                : status === "waiting"
                ? "Czekam na rolę od serwera..."
                : "Oczekiwanie na połączenie..."}
            </p>
          </IonText>

          {errorMessage && (
            <IonText color="danger">
              <p>{errorMessage}</p>
            </IonText>
          )}

          <div className="chat-log">
            {chatLog.map((msg, i) => (
              <p key={i} className={msg.startsWith("Ty:") ? "sender" : "receiver"}>
                {msg}
              </p>
            ))}
          </div>

          <div className="chat-input-area">
            <IonInput
              value={message}
              onIonChange={(e) => setMessage(e.detail.value!)}
              placeholder="Wpisz wiadomość..."
            />
            <IonButton onClick={sendMessage}>Wyślij</IonButton>
          </div>
        </div>
      </IonContent>
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
    </IonPage>
  );
};

<<<<<<< HEAD
export default Chats;
=======
export default Chat;
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
