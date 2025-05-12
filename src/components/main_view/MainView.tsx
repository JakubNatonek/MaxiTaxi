import React, { useState, useRef, useEffect } from "react";
import {
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
// import MapComponent2 from "../map/map2";

interface MainViewProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const MainView: React.FC<MainViewProps> = ({
  sendEncryptedData,
  getEncryptedData,
}) => {
  const [currentPage, setCurrentPage] = useState("map");
  const [pageParams, setPageParams] = useState<{ rideId?: number } | null>(
    null
  );
  const [orders, setOrders] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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

  useEffect(() => {
    getOrders();
    getUserLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getOrders();
      // getUserLocation();
      // console.log("cos");
    }, 5000);

    return () => clearInterval(interval);
  }, []);
    useEffect(() => {
    if (userLocation) {
      sendLocalization();
    }
  }, [userLocation]);

  const sendLocalization = async () => {
    if (!userLocation) return;

    const result = await sendEncryptedData("lokalizacja", {
      szerokosc_geo: userLocation.lat,
      dlugosc_geo: userLocation.lng,
    });
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

  const getOrders = async () => {
    const response = await getEncryptedData("zlecenia");
    setOrders(response);
    console.log(response);
  };

  return (
    <IonApp>
      <IonSplitPane when="md" contentId="main">
        <Sidebar handlePageChange={handlePageChange} contentId="main" />
        <IonPage id="main">
          {currentPage === "map" && (
            <MapComponent
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
            />
          )}
          {currentPage === "payments" && <Payments />}
          {currentPage === "AdminPanel" && (
            <AdminPanel
              sendEncryptedData={sendEncryptedData}
              hashPassword={hashPassword}
              getEncryptedData={getEncryptedData}
            />
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
          {currentPage === "rides" && <Rides
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
              orders={orders} // Przekazanie zamówień do komponentu
           />}
            {currentPage === "profile" && <Profile />}
        </IonPage>
      </IonSplitPane>
    </IonApp>
  );
};

export default MainView;
