import React, { useEffect, useRef, useState } from "react";
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonApp,
  IonPage,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonLoading,
  IonModal,
} from "@ionic/react";

import "leaflet/dist/leaflet.css";

import polyline from "polyline";

import L from "leaflet";
import "./rides.css";

interface Order {
  zlecenie_id: number; // ID zlecenia
  cena: string; // Cena przejazdu
  data_zamowienia: string; // Data zamówienia
  data_zakonczenia: string | null; // Data zakończenia (może być null)
  dystans_km: string; // Dystans w kilometrach
  kierowca_id: number; // ID kierowcy
  kierowca_imie: string; // Imię kierowcy
  pasazer_id: number; // ID pasażera
  pasazer_imie: string; // Imię pasażera (może być "NULL")
  status: string; // Status zlecenia (np. "zlecono")
  trasa_przejazdu: string; // Zakodowana trasa przejazdu (np. w formacie polyline)
}

interface RidesProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
  orders: Order[]; // Opcjonalna lista zamówień
  handlePageChange: (page: string, params?: any) => void;  
}

const Rides: React.FC<RidesProps> = ({
  sendEncryptedData,
  getEncryptedData,
  orders, // Użyj przekazanej listy zamówień lub pustej tablicy
  handlePageChange,
}) => {
  const [myOrders, setMyOrders] = useState<Order[]>(orders);
  const [isMapVisible, setIsMapVisible] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null); // Correct typing for mapRef
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     getUserLocation();
  //     // console.log("cos");
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, []);

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

  useEffect(() => {
    // console.log(mapInstance);
    if (mapRef.current && userLocation && !mapInstance) {
      const map = L.map(mapRef.current).setView(
        [userLocation.lat, userLocation.lng],
        13
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      setMapInstance(map);
    }
  }, [userLocation, mapInstance]);

  const handleShowMap = (route: string) => {
    setIsMapVisible(true);
    setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize();
        handleTrasShow(route); // Przenosimy tu, żeby trasa była renderowana po poprawnym przeliczeniu rozmiarów
      }
    }, 100);
  };

  const handleTrasShow = (route: string) => {
    if (mapInstance) {
      const decodedCoordinates = polyline.decode(route);
      console.log(decodedCoordinates);
      const routeDecoded = decodedCoordinates.map(
        (coord) => [coord[0], coord[1]] as [number, number]
      );

      mapInstance.eachLayer((layer) => {
        if (layer instanceof L.Polyline || layer instanceof L.Marker) {
          mapInstance.removeLayer(layer);
        }
      });

      if (routeDecoded.length > 0) {
        const routePolyline = L.polyline(routeDecoded, { color: "blue" }).addTo(
          mapInstance
        );

        // Dodanie markera dla punktu startowego
        const startPoint = routeDecoded[0];
        L.marker(startPoint, { title: "Odbiór Pasażera" })
          .addTo(mapInstance)
          .bindPopup("Odbiór Pasażera")
          .openPopup();

        // Dodanie markera dla punktu końcowego
        const endPoint = routeDecoded[routeDecoded.length - 1];
        L.marker(endPoint, { title: "Miejsce docelowe" })
          .addTo(mapInstance)
          .bindPopup("Miejsce docelowe");

        mapInstance.fitBounds(routePolyline.getBounds());
      }

      if (userLocation) {
        L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 6, // wielkość kropki
          color: " #00c8ff", // kolor obwódki
          fillColor: " #dff5f5", // kolor wypełnienia
          fillOpacity: 1,
        })
          .addTo(mapInstance)
          .bindPopup("Twoja lokalizacja");
      }
    }
  };

  const handleViewRideDetails = (orderId: number) => {
    handlePageChange("rideDetail", { rideId: orderId });
  };

  // W komponencie Rides dodaj useEffect do logowania statusów
  useEffect(() => {
    console.log("Statusy przejazdów:", myOrders.map(order => ({ id: order.zlecenie_id, status: order.status })));
  }, [myOrders]);

  return (
    <IonApp>
      {/* ===== STRONA DO PRZEGLĄDANIA PRZEJAZDÓW ===== */}
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
        <IonContent>
          {/* <IonLoading isOpen={busy} message="Ładowanie..." /> */}
          {!isMapVisible && (
            <IonList>
              {myOrders.map((order) => (
                <IonCard
                  key={order.zlecenie_id}
                  className={order.status === "zlecono" || order.status === "w trakcie" ? "active-ride" : ""}
                  onClick={() => handleViewRideDetails(order.zlecenie_id)}
                >
                  <IonCardHeader>
                    <IonCardTitle className="order-card-title" style={{ color: "white" }}>
                      Zlecenie nr: {order.zlecenie_id}
                    </IonCardTitle>
                    <div className="order-card-details">
                      <p>
                        Pasażer:{" "}
                        {order.pasazer_imie !== "NULL"
                          ? order.pasazer_imie
                          : "Nieznany"}
                      </p>
                      <p>Cena: {order.cena} zł</p>
                      <p>Dystans: {order.dystans_km} km</p>
                      <p>
                        Data zamówienia:{" "}
                        {new Date(order.data_zamowienia).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Status:</strong> {order.status}
                      </p>
                    </div>
                  </IonCardHeader>
                </IonCard>
              ))}
              {!myOrders.length && (
                <div className="no-orders">Brak dostępnych zleceń</div>
              )}
            </IonList>
          )}

          <div
            id="map"
            className="map"
            ref={mapRef}
            style={{
              height: "500px",
              width: "100%",
              display: isMapVisible ? "block" : "none",
            }}
          ></div>

          {isMapVisible && (
            <IonButton
              expand="full"
              color="medium"
              onClick={() => {
                setIsMapVisible(!isMapVisible);
              }}
            >
              Zamknij
            </IonButton>
          )}
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default Rides;
