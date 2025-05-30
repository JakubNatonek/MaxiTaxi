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
  IonRow,
  IonCol,
} from "@ionic/react";

import "leaflet/dist/leaflet.css";

import polyline from "polyline";

import L from "leaflet";

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

interface DriverOrdersProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
  orders: Order[]; // Opcjonalna lista zamówień
}

const DriverOrders: React.FC<DriverOrdersProps> = ({
  sendEncryptedData,
  getEncryptedData,
  orders, // Użyj przekazanej listy zamówień lub pustej tablicy
}) => {
  const [myOrders, setMyOrders] = useState<Order[]>(orders);
  const [curentOrder, setCurentOrder] = useState<Order | null>(null);
  const [isMapVisible, setIsMapVisible] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";
  const KEY = import.meta.env.VITE_REACT_APP_SECRET_KEY || "";

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

  useEffect(() => {
    setMyOrders(orders)
  }, [orders]);

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

  const handleShowMap = (order: Order) => {
    setIsMapVisible(true);
    setCurentOrder(order);
    setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize();
        handleTrasShow(order); // Przenosimy tu, żeby trasa była renderowana po poprawnym przeliczeniu rozmiarów
      }
    }, 100);
  };

  const handleTrasShow = (order: Order) => {
    if (mapInstance) {
      const decodedCoordinates = polyline.decode(order.trasa_przejazdu);
      // console.log(decodedCoordinates);
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

  async function generateKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(KEY), // 16 bajtów
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptData(
    data: Record<string, unknown>
  ): Promise<{ iv: number[]; data: number[] }> {
    const key = await generateKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      new TextEncoder().encode(JSON.stringify(data))
    );
    return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
  }

  async function updateOrderStatus(
    orderId: number,
    statusId: number
  ): Promise<any> {
    try {
      const endpoint = `zlecenia/${orderId}/status`;
      const data = { status_id: statusId };

      const encryptedPayload = await encryptData(data); // Szyfrowanie danych
      const token = localStorage.getItem("jwt"); // Pobierz token z localStorage

      const response = await fetch(`${SERVER}/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(encryptedPayload),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || `Błąd ${response.status}`);
      }

      const result = await response.json();
      return result; // Zwróć wynik z serwera
    } catch (error: any) {
      console.error("Błąd przy aktualizowaniu statusu zlecenia:", error);
      throw error;
    }
  }

  return (
    <IonApp>
      {/* ===== STRONA ZLECEN ===== */}
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
              {myOrders
                .filter((order) => order.status === "zlecono")
                .map((order) => (
                  <IonCard
                    key={order.zlecenie_id}
                    className="order-card"
                    onClick={() => handleShowMap(order)}
                  >
                    <IonCardHeader>
                      <IonCardTitle
                        className="order-card-title"
                        style={{ color: "white" }}
                      >
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
                      </div>
                    </IonCardHeader>
                  </IonCard>
                ))}
              {!myOrders.filter((order) => order.status === "zlecono").length && (
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
            <IonContent>
              <IonRow>
                <IonCol>
                  <IonButton expand="full" color="success" onClick={() => {
                    updateOrderStatus(curentOrder!.zlecenie_id, 2);
                    setIsMapVisible(false);
                  }}>
                    Akceptuj
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton expand="full" color="danger" onClick={() => {
                    updateOrderStatus(curentOrder!.zlecenie_id, 4);
                    setIsMapVisible(false);
                  }}>
                    Odrzuć
                  </IonButton>
                </IonCol>
              </IonRow>
              <IonButton
                expand="full"
                color="medium"
                onClick={() => {
                  setIsMapVisible(!isMapVisible);
                }}
              >
                Zamknij
              </IonButton>
            </IonContent>
          )}
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default DriverOrders;
