<<<<<<< HEAD
import React, { useState, useRef } from "react";
import {
  IonApp,
=======
import React from "react";
import {
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
<<<<<<< HEAD
  IonSplitPane,
=======
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
  IonTitle,
  IonToolbar,
} from "@ionic/react";

import {
  personOutline,
  walletOutline,
  cardOutline,
<<<<<<< HEAD
  callOutline,
  notificationsOutline,
  peopleOutline,
  heartOutline,
  globeOutline,
=======
  peopleOutline,
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
  informationCircleOutline,
  logOutOutline,
  mapOutline,
} from "ionicons/icons";

<<<<<<< HEAD
=======
import { jwtDecode } from "jwt-decode";
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
import "./Sidebar.css";

interface SidebarProps {
  handlePageChange: (page: string) => void;
  contentId: string;
}

const Sidebar: React.FC<SidebarProps> = ({ handlePageChange, contentId }) => {
<<<<<<< HEAD
  const role = localStorage.getItem("role"); // Pobierz rolę użytkownika z localStorage

const token = localStorage.getItem("jwt");
let email = "";
if (token) {
  try {
    email = JSON.parse(atob(token.split('.')[1])).email;
  } catch { /* ignore */ }
}

  const goToPayments = () => {
    handlePageChange("payments");
  };

  const goToChatList = () => handlePageChange("ChatList");

  const goToMap = () => {
    handlePageChange("map");
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt"); // Usuń token JWT
    window.location.reload(); // Przeładowanie strony
  };

=======
  const role = localStorage.getItem("role");

  const goToPayments = () => handlePageChange("payments");
  const goToMap = () => handlePageChange("map");
  const goToChat = () => handlePageChange("chat");
  const goToAdmin = () => handlePageChange("AdminPanel");
  const goToOrders = () => handlePageChange("driverOrders");

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("role");
    window.location.reload();
  };

  let userEmail = "Nieznany użytkownik";
  let userType = "";

  const token = localStorage.getItem("jwt");
  if (token) {
    try {
      const decoded = jwtDecode<{ email: string; userType: string }>(token);
      userEmail = decoded.email;
      userType = decoded.userType;
    } catch (err) {
      console.error("Błąd dekodowania tokena:", err);
    }
  }

>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
  return (
    <IonMenu contentId={contentId}>
      <IonHeader>
        <IonToolbar color="custom-orange">
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
<<<<<<< HEAD
      <IonContent>
      <div style={{ textAlign: "center", padding: "20px" }}>
      <h3 style={{ margin: 0 }}>
        {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Użytkownik"}
      </h3>
      <p style={{ fontSize: "12px", color: "#555" }}>
        {email || "brak@danych.pl"}
      </p>
</div>
=======

      <IonContent>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h3 style={{ margin: 0, fontWeight: "bold" }}>{userType || "Użytkownik"}</h3>
          <p style={{ fontSize: "15px", color: "white" }}>{userEmail}</p>
        </div>

>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
        <IonList>
          <IonMenuToggle autoHide={false}>
            <IonItem button>
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>Przejazdy</IonLabel>
            </IonItem>
<<<<<<< HEAD
=======

>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
            <IonItem button>
              <IonIcon icon={walletOutline} slot="start" />
              <IonLabel>Portfel</IonLabel>
            </IonItem>
<<<<<<< HEAD
=======

>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
            <IonItem button onClick={goToPayments}>
              <IonIcon icon={cardOutline} slot="start" />
              <IonLabel>Płatności</IonLabel>
            </IonItem>
<<<<<<< HEAD
=======

>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
            <IonItem button onClick={goToMap}>
              <IonIcon icon={mapOutline} slot="start" />
              <IonLabel>Mapa</IonLabel>
            </IonItem>
<<<<<<< HEAD
            <IonItem button onClick={goToChatList}>
              <IonIcon icon={peopleOutline} slot="start" />
              <IonLabel>Czaty</IonLabel>
            </IonItem>
=======

            <IonItem button onClick={goToChat}>
              <IonIcon icon={peopleOutline} slot="start" />
              <IonLabel>Czat</IonLabel>
            </IonItem>

>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
            <IonItem button>
              <IonIcon icon={informationCircleOutline} slot="start" />
              <IonLabel>O Nas</IonLabel>
            </IonItem>
<<<<<<< HEAD
            {(role === "admin") && (
              <IonItem button onClick={() => handlePageChange("AdminPanel")}>
=======

            {role === "admin" && (
              <IonItem button onClick={goToAdmin}>
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
                <IonIcon icon={peopleOutline} slot="start" />
                <IonLabel>Zarządzanie użytkownikami</IonLabel>
              </IonItem>
            )}
<<<<<<< HEAD
            {(role === "kierowca" || role === "admin") && (
              <IonItem button onClick={() => handlePageChange("driverOrders")}>
=======

            {(role === "kierowca" || role === "admin") && (
              <IonItem button onClick={goToOrders}>
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
                <IonIcon icon={mapOutline} slot="start" />
                <IonLabel>Zlecenia kierowcy</IonLabel>
              </IonItem>
            )}

<<<<<<< HEAD
            {/* ===== WYLOGUJ ===== */}
=======
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
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
