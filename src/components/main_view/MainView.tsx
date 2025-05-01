import React, { useState, useRef } from "react";
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
// import MapComponent2 from "../map/map2";

interface MainViewProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  getEncryptedData: (
    endpoint: string
  ) => Promise<any>;
}

const MainView: React.FC<MainViewProps> = ({
  sendEncryptedData,
  getEncryptedData,
}) => {
  const [currentPage, setCurrentPage] = useState("map");

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

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
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
          {currentPage === "driverOrders" && <DriverOrders />}
        </IonPage>
      </IonSplitPane>
    </IonApp>
  );
};

export default MainView;
