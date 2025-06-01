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
  starOutline, 
  mapOutline,
  carOutline,
} from "ionicons/icons";

import { jwtDecode } from "jwt-decode";
import "./Sidebar.css";

import { JwtPayload } from "../../JwtPayLoad";

interface SidebarProps {
  handlePageChange: (page: string) => void;
  contentId: string;
}

const Sidebar: React.FC<SidebarProps> = ({ handlePageChange, contentId }) => {

const roleId = Number(localStorage.getItem("roleId"));

  const token = localStorage.getItem("jwt");

  let email = "";
  if (token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      email = decoded.email;
      // userType = decoded.userType;
    } catch (err) {
      console.error("Błąd dekodowania tokena:", err);
    }
  }

  // const token = localStorage.getItem("jwt");

  // if (token) {
  //   try {
  //     email = JSON.parse(atob(token.split('.')[1])).email;
  //   } catch { /* ignore */ }
  // }


  // const handleLogout = () => {
  //   localStorage.removeItem("jwt"); // Usuń token JWT
  //   window.location.reload(); // Przeładowanie strony
  // };

  // const role = localStorage.getItem("role");

  const goToChatList = () => handlePageChange("ChatList");
  const goToPayments = () => handlePageChange("payments");
  const goToMap = () => handlePageChange("map");
  const goToChat = () => handlePageChange("chat");
  const goToAdmin = () => handlePageChange("AdminPanel");
  const goToOrders = () => handlePageChange("driverOrders");
  const goToRides = () => handlePageChange("rides");
  const goToDriverRanking = () => handlePageChange("DriverRanking");

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("roleId");;
    window.location.reload();
  };

    // Mapowanie id roli na nazwę
    const roleNames: Record<number, string> = {
      1: "Admin",
      2: "Pasażer",
      3: "Kierowca"
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
    <h3 style={{ margin: 0 }}>
      {roleNames[roleId] || "Użytkownik"}
    </h3>
    <p style={{ fontSize: "12px", color: "#555" }}>
      {email || "brak@danych.pl"}
    </p>
    </div>
      <IonList>
        <IonMenuToggle autoHide={false}>
          <IonItem button onClick={goToDriverRanking}>
            <IonIcon icon={starOutline} slot="start" />
            <IonLabel>Ranking Kierowców</IonLabel>
          </IonItem>
          <IonItem button onClick={goToRides}>
            <IonIcon icon={personOutline} slot="start" />
            <IonLabel>Przejazdy</IonLabel>
          </IonItem>
          <IonItem button onClick={goToPayments}>
            <IonIcon icon={cardOutline} slot="start" />
            <IonLabel>Płatności</IonLabel>
          </IonItem>
          <IonItem button onClick={goToMap}>
            <IonIcon icon={mapOutline} slot="start" />
            <IonLabel>Mapa</IonLabel>
          </IonItem>
          <IonItem button onClick={goToChatList}>
            <IonIcon icon={peopleOutline} slot="start" />
            <IonLabel>Czaty</IonLabel>
          </IonItem>
          <IonItem button onClick={() => handlePageChange("profile")}>
            <IonIcon icon={personOutline} slot="start" />
            <IonLabel>Profil</IonLabel>
          </IonItem>
          {/* ZAMIANA: Sprawdzanie po roleId */}
          {roleId === 1 && (
            <>
              <IonItem button onClick={goToAdmin}>
                <IonIcon icon={peopleOutline} slot="start" />
                <IonLabel>Zarządzanie użytkownikami</IonLabel>
              </IonItem>
              <IonItem button onClick={() => handlePageChange("AdminRidesPanel")}>
                <IonIcon icon={personOutline} slot="start" />
                <IonLabel>Zarządzanie przejazdami</IonLabel>
              </IonItem>
              <IonItem button onClick={() => handlePageChange("AdminDriversPanel")}>
                <IonIcon icon={carOutline} slot="start" />
                <IonLabel>Zarządzanie kierowcami</IonLabel>
              </IonItem>
            </>
          )}

          {(roleId === 3 || roleId === 1) && (
            <IonItem button onClick={goToOrders}>
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
