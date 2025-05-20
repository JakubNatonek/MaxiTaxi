import React, { useState, useEffect, useRef } from "react";
import {
  IonApp,
  IonSplitPane,
  IonPage,
  IonToast,
} from "@ionic/react";
import { io } from "socket.io-client";
import Sidebar from "../side_bar/Sidebar";
import MapComponent from "../map/map";
import Payments from "../payments/Payments";
import AdminPanel from "../AdminPanel/AdminPanel";
import DriverOrders from "../driverOrders/driverOrders";
import ChatList from "../chat/ChatList";
import Chat from "../chat/Chats";
import Rides from "../ride/rides";

interface ChatRoom {
  rideId: number;
  otherName: string;
}

interface MainViewProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:8080";
const socket = io(SERVER, { transports: ["websocket"] });

function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const MainView: React.FC<MainViewProps> = ({ sendEncryptedData, getEncryptedData }) => {
  const [currentPage, setCurrentPage] = useState<string>("map");
  const [pageParams, setPageParams] = useState<{ rideId?: number; otherName?: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const token = localStorage.getItem("jwt");
  const decoded = token ? parseJwt(token) : null;
  const role = decoded?.userType;
  const myEmail = decoded?.email;

  const [toastChat, setToastChat] = useState<{ open: boolean; message: string; rideId: number; otherName: string }>({
    open: false,
    message: "",
    rideId: 0,
    otherName: "",
  });

  const [showNewRideNotification, setShowNewRideNotification] = useState(false);
  const [lastRideNotify, setLastRideNotify] = useState(0);

  const prevStatuses = useRef<Record<number, number>>({});
  const [acceptedToast, setAcceptedToast] = useState<{
    open: boolean;
    rideId: number;
    driverName: string;
  }>({ open: false, rideId: 0, driverName: "" });

  const handlePageChange = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || null);
  };

  const openChatFromToast = () => {
    setCurrentPage("Chat");
    setPageParams({ rideId: toastChat.rideId, otherName: toastChat.otherName });
    setToastChat(t => ({ ...t, open: false }));
  };

  const getOrders = async () => {
    try {
      const response = await getEncryptedData("zlecenia") as any[];

      if (role === "kierowca") {
        const pendingCount = response.filter(o => o.status === "zlecono").length;
        const now = Date.now();
        if (pendingCount > prevPendingCount && now - lastRideNotify > 20000) {
          setShowNewRideNotification(true);
          setLastRideNotify(now);
        }
        setPrevPendingCount(pendingCount);
      }

      if (role === "pasazer") {
        response.forEach(o => {
          const prev = prevStatuses.current[o.zlecenie_id];
          if (prev !== 2 && o.status_id === 2) {
            setAcceptedToast({
              open: true,
              rideId: o.zlecenie_id,
              driverName: o.kierowca_imie,
            });
          }
        });
      }

      const newMap: Record<number, number> = {};
      response.forEach(o => {
        newMap[o.zlecenie_id] = o.status_id;
      });
      prevStatuses.current = newMap;

      setOrders(response);

      getEncryptedData("chats")
        .then((rooms: ChatRoom[] = []) => {
          rooms.forEach(r => socket.emit("joinRoom", { rideId: r.rideId }));
        })
        .catch(console.warn);

    } catch (e) {
      console.error("Błąd pobierania zleceń:", e);
    }
  };

  useEffect(() => {
    getOrders();
    const id = setInterval(getOrders, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!myEmail) return;
    socket.on("receiveMessage", ({ rideId, senderEmail, senderName, message }) => {
      if (senderEmail === myEmail) return;                            // własne pomiń
      if (currentPage === "Chat" && pageParams?.rideId === rideId) return; // jeśli w środku czatu, też pomiń
      setToastChat({
        open: true,
        message: `${senderName}: ${message.slice(0, 30)}…`,
        rideId,
        otherName: senderName,
      });
    });
    return () => { socket.off("receiveMessage"); };
  }, [myEmail, currentPage, pageParams]);

  return (
    <IonApp>
      <IonToast
        cssClass="custom-toast"
        isOpen={toastChat.open}
        message={toastChat.message}
        position="bottom"
        duration={5000}
        onDidDismiss={() => setToastChat(t => ({ ...t, open: false }))}
        buttons={[
          { text: "Otwórz", handler: openChatFromToast },
          { text: "Zamknij", role: "cancel", handler: () => setToastChat(t => ({ ...t, open: false })) }
        ]}
      />

      {role === "kierowca" && (
        <IonToast
          isOpen={showNewRideNotification}
          message="Masz nowe zlecenie"
          position="bottom"
          color="warning"
          duration={6000}
          buttons={[
            { text: "Przejdź", handler: () => { setShowNewRideNotification(false); handlePageChange("driverOrders"); } },
            { text: "Zamknij", role: "cancel", handler: () => setShowNewRideNotification(false) }
          ]}
          onDidDismiss={() => setShowNewRideNotification(false)}
        />
      )}

      {role === "pasazer" && (
        <IonToast
          isOpen={acceptedToast.open}
          message={`Kierowca ${acceptedToast.driverName} zaakceptował Twój przejazd`}
          position="bottom"
          color="success"
          duration={8000}
          buttons={[
            {
              text: "Czat",
              handler: () => {
                handlePageChange("ChatList", { rideId: acceptedToast.rideId });
                setAcceptedToast(t => ({ ...t, open: false }));
              }
            },
            {
              text: "OK",
              role: "cancel",
              handler: () => setAcceptedToast(t => ({ ...t, open: false }))
            }
          ]}
          onDidDismiss={() => setAcceptedToast(t => ({ ...t, open: false }))}
        />
      )}

      <IonSplitPane when="md" contentId="main">
        <Sidebar handlePageChange={handlePageChange} contentId="main" />
        <IonPage id="main">
          {currentPage === "map" && (<MapComponent sendEncryptedData={sendEncryptedData} getEncryptedData={getEncryptedData} />)}
          {currentPage === "payments" && <Payments sendEncryptedData={sendEncryptedData} getEncryptedData={getEncryptedData}/>}
          {currentPage === "AdminPanel" && <AdminPanel sendEncryptedData={sendEncryptedData} hashPassword={undefined!} getEncryptedData={getEncryptedData} />}
          {currentPage === "ChatList" && <ChatList handlePageChange={handlePageChange} getEncryptedData={getEncryptedData} />}
          {currentPage === "Chat" && pageParams?.rideId !== undefined && <Chat rideId={pageParams.rideId} otherName={pageParams.otherName!} sendEncryptedData={sendEncryptedData} />}
          {currentPage === "driverOrders" && <DriverOrders sendEncryptedData={sendEncryptedData} getEncryptedData={getEncryptedData} orders={orders} handlePageChange={handlePageChange} />}
          {currentPage === "rides" && <Rides sendEncryptedData={sendEncryptedData} getEncryptedData={getEncryptedData} orders={orders} />}
        </IonPage>
      </IonSplitPane>
    </IonApp>
  );
};

export default MainView;
