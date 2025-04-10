import React, { useState, useRef } from "react";
import {
  IonApp,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

import {
  personOutline,
  walletOutline,
  cardOutline,
  callOutline,
  notificationsOutline,
  peopleOutline,
  heartOutline,
  globeOutline,
  informationCircleOutline,
  logOutOutline,
  mapOutline,
} from "ionicons/icons";

import "./Sidebar.css";

interface SidebarProps {
  handlePageChange: (page: string) => void;
  contentId: string;
}

const Sidebar: React.FC<SidebarProps> = ({ handlePageChange, contentId }) => {
  const role = localStorage.getItem("role"); // Pobierz rolę użytkownika z localStorage

  const goToPayments = () => {
    handlePageChange("payments");
  };

  const goToMap = () => {
    handlePageChange("map");
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt"); // Usuń token JWT
    window.location.reload(); // Przeładowanie strony
  };

  return (
    <IonMenu contentId={contentId}>
      <IonHeader>
        <IonToolbar color="custom-orange">
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h3 style={{ margin: 0 }}>Jan Wiewiór</h3>
          <p style={{ fontSize: "12px", color: "#555" }}>@gmail.com</p>
        </div>
        <IonList>
          <IonMenuToggle autoHide={false}>
            <IonItem button>
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>Przejazdy</IonLabel>
            </IonItem>
            <IonItem button>
              <IonIcon icon={walletOutline} slot="start" />
              <IonLabel>Portfel</IonLabel>
            </IonItem>
            <IonItem button onClick={goToPayments}>
              <IonIcon icon={cardOutline} slot="start" />
              <IonLabel>Płatności</IonLabel>
            </IonItem>
            <IonItem button onClick={goToMap}>
              <IonIcon icon={mapOutline} slot="start" />
              <IonLabel>Mapa</IonLabel>
            </IonItem>
            <IonItem button>
              <IonIcon icon={peopleOutline} slot="start" />
              <IonLabel>Czaty</IonLabel>
            </IonItem>
            <IonItem button>
              <IonIcon icon={informationCircleOutline} slot="start" />
              <IonLabel>O Nas</IonLabel>
            </IonItem>
            {(role === "admin") && (
              <IonItem button onClick={() => handlePageChange("AdminPanel")}>
                <IonIcon icon={peopleOutline} slot="start" />
                <IonLabel>Zarządzanie użytkownikami</IonLabel>
              </IonItem>
            )}
            {(role === "kierowca" || role === "admin") && (
              <IonItem button onClick={() => handlePageChange("driverOrders")}>
                <IonIcon icon={mapOutline} slot="start" />
                <IonLabel>Zlecenia kierowcy</IonLabel>
              </IonItem>
            )}

            {/* ===== WYLOGUJ ===== */}
            <IonItem button onClick={handleLogout}>
              <IonIcon icon={logOutOutline} slot="start" />
              <IonLabel>Wyloguj się</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Sidebar;
