import React, { useState, useEffect } from "react";
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonPage,
  IonButtons,
  IonMenuButton,
  IonRow,
  IonCol,
  IonInput,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonMenuToggle,
} from "@ionic/react";


import "./map.css";

import Sidebar from "../side_bar/Sidebar";


interface MapComponentProps {
  latitude?: number;
  longitude?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mapLatitudeQ, setMapLatitudeQ] = useState<number | null>(null);
  const [mapLongitudeQ, setMapLongitudeQ] = useState<number | null>(null);


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

  const searchLocation = async () => {
    if (searchQuery) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`
      );
      const data = await response.json();
      if (data.length > 0) {
        const result = data[0];
        setMapLatitudeQ(parseFloat(result.lat));
        setMapLongitudeQ(parseFloat(result.lon));
        setSearchQuery("");
      }
    }
  };

  useEffect(() => {
    if (!latitude || !longitude) {
      getUserLocation();
    }
  }, [latitude, longitude]);

  const mapLatitude = mapLatitudeQ || (userLocation && userLocation.lat);
  const mapLongitude = mapLongitudeQ || (userLocation && userLocation.lng);

  if (!mapLatitude || !mapLongitude) {
    return <div>Ładowanie...</div>;
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapLongitude - 0.05}%2C${mapLatitude - 0.05}%2C${mapLongitude + 0.05}%2C${mapLatitude + 0.05}&layer=transport&marker=${mapLatitude},${mapLongitude}`;

  return (
    <IonApp>
        {/* ===== STRONA MAPY ===== */}
        <IonPage id="main">
          <IonHeader>
            <IonToolbar color="custom-grey">
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle className="toolbar-logo-title">
              <img src="public/assets/menu_logo.png" alt="MaxiTaxi Logo" />
              </IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent fullscreen className="no-padding">
            <IonRow className="ion-padding">
              <IonCol>
                <IonInput
                  value={searchQuery}
                  onIonChange={(e) => setSearchQuery(e.detail.value!)}
                  placeholder="Wyszukaj miejsce"
                />
                <IonButton onClick={searchLocation} expand="full">
                  Wyszukaj
                </IonButton>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol className="ion-text-center">
                <iframe
                  title="OpenStreetMap"
                  src={mapUrl}
                  width="100%"
                  height="500px"
                  style={{ border: "none" }}
                ></iframe>
              </IonCol>
            </IonRow>
          </IonContent>
        </IonPage>
    </IonApp>
  );
};

export default MapComponent;
