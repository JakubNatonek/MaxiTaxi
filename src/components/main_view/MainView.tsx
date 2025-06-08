import React, { useState, useRef, useEffect } from "react";
import {
  IonAlert,
  IonApp,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonRow,
  IonSplitPane,
  IonText,
  IonToast,
} from "@ionic/react";

import LoginForm from "../login_form/LoginForm";
import RegisterForm from "../register/RegisterForm";
import MapComponent from "../map/map";
import Payments from "../payments/Payments";
import Sidebar from "../side_bar/Sidebar";
import AdminPanel from "../AdminPanel/AdminPanel";
import DriverOrders from "../driverOrders/driverOrders";
import ChatList from "../chat/ChatList";
import Chat from "../chat/Chats";
import Rides from "../ride/rides";
import Profile from "../profile/Profile";
import AdminRidesPanel from "../AdminRidesPanel/AdminRidesPanel";
import RideDetail from "../ride/RideDetail";
import DriverRanking from "../Ranking/DriverRanking";
import AdminDriversPanel from "../AdminDriverPanel/AdminDriversPanel";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "../../JwtPayLoad";
import { Order } from "../../OrderInt";
import { Driver } from "../../Driver";

interface ChatRoom {
  rideId: number;
  otherName: string;
}

interface MainViewProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>,
    method?: string
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const SERVER = import.meta.env.VITE_REACT_APP_API_URL;
const socket = io(SERVER, { transports: ["websocket"] });

const MainView: React.FC<MainViewProps> = ({
  sendEncryptedData,
  getEncryptedData,
}) => {
  const [currentPage, setCurrentPage] = useState("map");
  const [pageParams, setPageParams] = useState<{
    rideId?: number;
    otherName?: string;
  } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const [newOrderToast, setNewOrderToast] = useState<{
    isOpen: boolean;
    order: Order | null;
  }>({
    isOpen: false,
    order: null,
  });
  const [showNewOrderToast, setShowNewOrderToast] = useState(false);

  const token = localStorage.getItem("jwt");
  let myEmail = null;
  let userRole = null;
  let userName = "";

  if (token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      // console.log(decoded);
      myEmail = decoded.email;
      userRole = decoded.roleId;
      userName = userRole === 1 ? "Administrator" : "Ty";
      // userType = decoded.userType;
    } catch (err) {
      console.error("Błąd dekodowania tokena:", err);
    }
  }

  const [toastChat, setToastChat] = useState<{
    open: boolean;
    message: string;
    rideId: number;
    otherName: string;
  }>({
    open: false,
    message: "",
    rideId: 0,
    otherName: "",
  });

  const [showNewRideNotification, setShowNewRideNotification] = useState(false);
  const [lastRideNotify, setLastRideNotify] = useState(0);

  const prevStatuses = useRef<Record<number, String>>({});
  const [acceptedToast, setAcceptedToast] = useState<{
    open: boolean;
    rideId: number;
    driverName: string;
  }>({ open: false, rideId: 0, driverName: "" });

  // Funkcja hashująca hasło DO POPRAWY NAJPRAWDOPODOBNIEJ MOŻNA USUNĄĆ Z AUTENTICATION
  const hashPassword = async (password: string, salt: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  };

  const handlePageChange = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || null);
  };

  const openChatFromToast = () => {
    setCurrentPage("Chat");
    setPageParams({ rideId: toastChat.rideId, otherName: toastChat.otherName });
    setToastChat((t) => ({ ...t, open: false }));
  };

  useEffect(() => {
    getOrders();
    getUserLocation();
    getNearbyDrivers();
  }, []);

  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);

  const getNearbyDrivers = async () => {
    try {
      const response = await getEncryptedData("bliscy");
      console.log("Nearby drivers:", response);
      setNearbyDrivers(response);
      return response;
    } catch (error) {
      console.error("Error fetching nearby drivers:", error);
      return [];
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      getOrders();
      getUserLocation();
      sendLocalization();
      getNearbyDrivers();
      // console.log("cos");
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (userLocation) {
      sendLocalization();
    }
  }, [userLocation]);

  useEffect(() => {
    if (!myEmail) return;
    socket.on(
      "receiveMessage",
      ({ rideId, senderEmail, senderName, message }) => {
        if (senderEmail === myEmail) return; // własne pomiń
        if (currentPage === "Chat" && pageParams?.rideId === rideId) return; // jeśli w środku czatu, też pomiń
        setToastChat({
          open: true,
          message: `${senderName}: ${message.slice(0, 30)}…`,
          rideId,
          otherName: senderName,
        });
      }
    );
    return () => {
      socket.off("receiveMessage");
    };
  }, [myEmail, currentPage, pageParams]);

  const sendLocalization = async () => {
    if (!userLocation) return;

    const result = await sendEncryptedData(
      "lokalizacja",
      {
        szerokosc_geo: userLocation.lat,
        dlugosc_geo: userLocation.lng,
      },
      "POST"
    );
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Błąd geolokalizacji: ", error);
        }
      );
    }
  };

  let ordersPreviusList: Order[] = [];

  /**
   * Returns an array of orders that exist in the response but not in the previous list
   * @param response The new orders from the API
   * @param previousOrders The cached previous orders
   * @returns Array of new orders
   */
  const getNewOrders = (
    response: Order[],
    previousOrders: Order[]
  ): Order[] => {
    // Create a Set of previous order IDs for efficient lookup
    const previousOrderIds = new Set(
      previousOrders.map((order) => order.zlecenie_id)
    );

    // Filter response to find orders not in the previous list
    return response.filter((order) => !previousOrderIds.has(order.zlecenie_id));
  };

  const getOrders = async () => {
    try {
      const response = await getEncryptedData("zlecenia");

      if (userRole === 3 || userRole === 1) {
        const pendingCount = response.filter(
          (o: Order) => o.status === "zlecono"
        ).length;
        const now = Date.now();
        if (pendingCount > prevPendingCount && now - lastRideNotify > 20000) {
          setShowNewRideNotification(true);
          setLastRideNotify(now);
        }
        setPrevPendingCount(pendingCount);
      }

      const newOrders = getNewOrders(response, ordersPreviusList);

      if (newOrders.length > 0) {
        // console.log("New orders received:", newOrders);
        ordersPreviusList = [...response];
        setOrders(response);
        // powiadomienie o nowym przejeżdzie
        const newPendingOrders = newOrders.filter(
          (order) => order.status === "zlecono"
        );
        if ((userRole === 3 || userRole === 1) && newPendingOrders.length > 0) {
          setNewOrderToast({
            isOpen: true,
            order: newPendingOrders[0],
          });
          setShowNewOrderToast(true);
        }
      }

      if (userRole === 2 || userRole === 1) {
        response.forEach((o: Order) => {
          const prev = prevStatuses.current[o.zlecenie_id];
          if (prev !== "w trakcie" && o.status === "w trakcie") {
            setAcceptedToast({
              open: true,
              rideId: o.zlecenie_id,
              driverName: o.kierowca_imie,
            });
          }
        });
      }

      const newMap: Record<number, string> = {};
      response.forEach((o: Order) => {
        newMap[o.zlecenie_id] = o.status;
      });
      prevStatuses.current = newMap;

      getEncryptedData("chats")
        .then((rooms: ChatRoom[] = []) => {
          rooms.forEach((r) => socket.emit("joinRoom", { rideId: r.rideId }));
        })
        .catch(console.warn);
    } catch (e) {
      console.error("Błąd pobierania zleceń:", e);
    }
  };

  const dismissToast = (orderId?: number) => {
    setNewOrderToast({ isOpen: false, order: null });
    setShowNewOrderToast(false);
  };

  const handleAcceptOrder = async (orderId?: number) => {
    if (!orderId) return;

    try {
      // Change order status to "w trakcie" (status_id: 2)
      await sendEncryptedData(
        `zlecenia/${orderId}/status`,
        { status_id: 2 },
        "PUT"
      );
      dismissToast(orderId);
      getOrders(); // Refresh orders
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };

  const handleRejectOrder = async (orderId?: number) => {
    if (!orderId) return;

    try {
      // Send request to change order status to "odrzucone" (status_id: 4)
      await sendEncryptedData(
        `zlecenia/${orderId}/status`,
        { status_id: 4 },
        "PUT"
      );
      dismissToast(orderId);
      getOrders(); // Refresh orders after rejection
    } catch (error) {
      console.error("Error rejecting order:", error);
    }
  };

  return (
    <IonApp>
      <IonToast
        cssClass="custom-toast"
        isOpen={toastChat.open}
        message={toastChat.message}
        position="bottom"
        duration={5000}
        onDidDismiss={() => setToastChat((t) => ({ ...t, open: false }))}
        buttons={[
          { text: "Otwórz", handler: openChatFromToast },
          {
            text: "Zamknij",
            role: "cancel",
            handler: () => setToastChat((t) => ({ ...t, open: false })),
          },
        ]}
      />

      {/* {userRole === 3 && (
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
      )} */}

      {(userRole === 3 || userRole === 1) &&
        newOrderToast.order &&
        showNewOrderToast && (
          <IonAlert
            isOpen={newOrderToast.isOpen}
            onDidDismiss={() => dismissToast(newOrderToast.order?.zlecenie_id)}
            cssClass="new-order-alert"
            header="🚖 NOWE ZLECENIE 🚖"
            message={`
            Pasażer: ${newOrderToast.order?.pasazer_imie}
            Odległość: ${parseFloat(
              newOrderToast.order?.dystans_km ?? "0"
            ).toFixed(1)} km
            Cena: ${parseFloat(newOrderToast.order?.cena ?? "0").toFixed(2)} zł
          `}
            buttons={[
              {
                text: "✅ PRZYJMIJ",
                cssClass: "accept-button",
                handler: () => {
                  handleAcceptOrder(newOrderToast.order?.zlecenie_id);
                },
              },
              {
                text: "❌ ODRZUĆ",
                cssClass: "reject-button",
                handler: () => {
                  handleRejectOrder(newOrderToast.order?.zlecenie_id);
                },
              },
            ]}
          />
        )}

      {userRole === 2 && (
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
                setAcceptedToast((t) => ({ ...t, open: false }));
              },
            },
            {
              text: "OK",
              role: "cancel",
              handler: () => setAcceptedToast((t) => ({ ...t, open: false })),
            },
          ]}
          onDidDismiss={() => setAcceptedToast((t) => ({ ...t, open: false }))}
        />
      )}

      <IonSplitPane when="md" contentId="main">
        <Sidebar handlePageChange={handlePageChange} contentId="main" />
        <IonPage id="main">
          {currentPage === "map" && (
            <MapComponent
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
              handlePageChange={handlePageChange}
              orders={orders}
              drivers={nearbyDrivers}
            />
          )}
          {currentPage === "payments" && (
            <Payments
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
            />
          )}
          {currentPage === "AdminPanel" && (
            <AdminPanel
              sendEncryptedData={sendEncryptedData}
              hashPassword={hashPassword}
              getEncryptedData={getEncryptedData}
            />
          )}
          {currentPage === "AdminRidesPanel" && (
            <AdminRidesPanel
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
            />
          )}
          {currentPage === "AdminDriversPanel" && (
            <AdminDriversPanel
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
            />
          )}
          {currentPage === "DriverRanking" && (
            <DriverRanking getEncryptedData={getEncryptedData} />
          )}
          {currentPage === "ChatList" && (
            <ChatList
              handlePageChange={handlePageChange}
              getEncryptedData={getEncryptedData}
            />
          )}

          {currentPage === "Chat" && pageParams?.rideId !== undefined && (
            <Chat
              rideId={pageParams.rideId}
              otherName={"TEST"} // Zmienić na odpowiednią nazwę
              sendEncryptedData={sendEncryptedData}
            />
          )}
          {currentPage === "driverOrders" && (
            <DriverOrders
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
              orders={orders} // Przekazanie zamówień do komponentu
            />
          )}
          {currentPage === "rideDetail" && pageParams?.rideId && (
            <RideDetail
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
              rideId={pageParams.rideId}
              handlePageChange={handlePageChange}
            />
          )}
          {currentPage === "rides" && (
            <Rides
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
              orders={orders}
              handlePageChange={handlePageChange}
            />
          )}
          {currentPage === "profile" && <Profile />}
        </IonPage>
      </IonSplitPane>
    </IonApp>
  );
};

export default MainView;
