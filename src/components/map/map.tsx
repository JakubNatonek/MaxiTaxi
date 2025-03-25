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
} from "ionicons/icons";

import "./map.css";

import { useHistory } from "react-router-dom";

interface MapComponentProps {
  latitude?: number;
  longitude?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mapLatitudeQ, setMapLatitudeQ] = useState<number | null>(null);
  const [mapLongitudeQ, setMapLongitudeQ] = useState<number | null>(null);

  const history = useHistory();

  const handleLogout = () => {
    // localStorage.removeItem("user"); // ← Jeśli przechowujesz dane
    history.push("/login");
  };

  const goToPayments = () => {
    history.push("/payments");
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
      <IonSplitPane contentId="main">
        {/* ===== MENU BOCZNE ===== */}
        <IonMenu contentId="main" type="overlay">
          <IonHeader>
            <IonToolbar color="custom-orange">
              <IonTitle >Menu</IonTitle>
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
                <IonItem button>
                        <IonIcon icon={peopleOutline} slot="start" />
                  <IonLabel>Czaty</IonLabel>
                </IonItem>
                <IonItem button>
                  <IonIcon icon={informationCircleOutline} slot="start" />
                  <IonLabel>O Nas</IonLabel>
                </IonItem>

                {/* ===== WYLOGUJ ===== */}
                <IonItem button onClick={handleLogout}>
                  <IonIcon icon={logOutOutline} slot="start" />
                  <IonLabel>Wyloguj się</IonLabel>
                </IonItem>
              </IonMenuToggle>
            </IonList>
          </IonContent>
        </IonMenu>

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
      </IonSplitPane>
    </IonApp>
  );
};

export default MapComponent;
