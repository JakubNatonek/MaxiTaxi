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
  IonCardContent,
  IonLoading,
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonTextarea,
  IonText,
  IonItem,
  IonLabel,
  IonList,
  IonToast,
} from "@ionic/react";
import { star, starOutline } from "ionicons/icons";
import "leaflet/dist/leaflet.css";
import polyline from "polyline";
import L from "leaflet";
import "./RideDetail.css";
import { Order } from "../../OrderInt";
import PayPalButton from "../payments/PayPalButton";

interface RideDetailProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>,
    method?: string
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
  rideId: number;
  handlePageChange: (page: string) => void;
}

const RideDetail: React.FC<RideDetailProps> = ({
  sendEncryptedData,
  getEncryptedData,
  rideId: rideIdProp,
  handlePageChange,
}) => {
  // Stan podstawowy
  const [ride, setRide] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);
  const [statusChanged, setStatusChanged] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>("");

  // Referencje do mapy
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<string | null>(null);
  const [rideId, setRideId] = useState<number>(rideIdProp);

  // Pobieranie danych przejazdu
  const fetchRideDetails = async (silentRefresh = false) => {
    if (!silentRefresh) {
      setIsLoading(true);
    }

    try {
      const response = await getEncryptedData(`zlecenia`);
      const foundRide = response.find((r: Order) => r.zlecenie_id === rideId);

      if (foundRide) {
        setRide((prevRide) => {
          if (
            prevRide &&
            prevRide.status === foundRide.status &&
            prevRide.cena === foundRide.cena &&
            prevRide.dystans_km === foundRide.dystans_km
          ) {
            return prevRide;
          }
          return foundRide;
        });
      } else {
        if (!silentRefresh) {
          setError("Nie znaleziono szczegółów przejazdu");
        }
      }
    } catch (err) {
      if (!silentRefresh) {
        setError("Wystąpił błąd podczas pobierania danych");
      }
    } finally {
      if (!silentRefresh) {
        setIsLoading(false);
      }
    }
  };

  // Inicjalne pobranie danych
  useEffect(() => {
    fetchRideDetails(false);
  }, [rideId]);

  // Odświeżanie danych co 5 sekund
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRideDetails(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [rideId]);

  // Inicjalizacja mapy
  useEffect(() => {
    if (mapRef.current && !mapInstance.current && ride) {
      setTimeout(() => {
        try {
          const map = L.map(mapRef.current!).setView(
            [50.049683, 19.944544],
            12
          );
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
          }).addTo(map);

          mapInstance.current = map;

          // Renderowanie trasy
          if (ride.trasa_przejazdu) {
            const decodedCoordinates = polyline.decode(ride.trasa_przejazdu);
            const routePoints = decodedCoordinates.map(
              (coord) => [coord[0], coord[1]] as [number, number]
            );

            if (routePoints.length > 0) {
              const routeLine = L.polyline(routePoints, {
                color: "blue",
                weight: 5,
              }).addTo(map);

              const startPoint = routePoints[0];
              const endPoint = routePoints[routePoints.length - 1];

              L.marker(startPoint, { title: "Miejsce startowe" })
                .addTo(map)
                .bindPopup("Miejsce startowe")
                .openPopup();

              L.marker(endPoint, { title: "Miejsce docelowe" })
                .addTo(map)
                .bindPopup("Miejsce docelowe");

              map.fitBounds(routeLine.getBounds());
            }
          }
        } catch (err) {
          console.error("Błąd inicjalizacji mapy:", err);
        }
      }, 500);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [ride]);

  // Automatyczne przekierowanie przy anulowaniu
  useEffect(() => {
    if (ride?.status === "anulowany") {
      const timer = setTimeout(() => {
        handlePageChange("map");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [ride?.status, handlePageChange]);

  // Funkcje obsługi akcji
  const handleCompleteRide = () => {
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    setShowPaymentModal(false);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setRatingError("Proszę wybrać ocenę");
      return;
    }

    if (!ride) return;

    try {
      setIsLoading(true);

      await sendEncryptedData(
        `zlecenia/${ride.zlecenie_id}/status`,
        { status_id: 3 },
        "PUT"
      );

      await sendEncryptedData("oceny", {
        kierowca_id: ride.kierowca_id,
        przejazd_id: ride.zlecenie_id,
        ocena: rating,
        komentarz: comment,
      });

      setRatingSuccess("Dziękujemy za ocenę!");

      setTimeout(() => {
        setShowRatingModal(false);
        handlePageChange("map");
      }, 2000);
    } catch (err) {
      setRatingError("Wystąpił błąd podczas zapisywania oceny");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (!ride) return;

    try {
      setIsLoading(true);

      await sendEncryptedData(
        `zlecenia/${ride.zlecenie_id}/status`,
        { status_id: 4 },
        "PUT"
      );

      setRatingSuccess("Przejazd został anulowany.");

      setTimeout(() => {
        handlePageChange("map");
      }, 2000);
    } catch (err) {
      setRatingError("Wystąpił błąd podczas anulowania przejazdu");
    } finally {
      setIsLoading(false);
    }
  };

  // Renderowanie gwiazdek oceny
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IonIcon
          key={i}
          icon={i <= rating ? star : starOutline}
          className={`rating-star ${i <= rating ? "active" : ""}`}
          onClick={() => setRating(i)}
        />
      );
    }
    return stars;
  };

  useEffect(() => {
    if (ride && ride.status) {
      const savedStatus = sessionStorage.getItem(
        "lastRideStatus_" + ride.zlecenie_id
      );

      if (savedStatus === null) {
        // Pierwszy raz otwieramy ten przejazd - zapisz status bez pokazywania powiadomienia
        sessionStorage.setItem(
          "lastRideStatus_" + ride.zlecenie_id,
          ride.status
        );
      } else if (savedStatus !== ride.status) {
        // Status się zmienił - pokaż powiadomienie
        let message = "";
        switch (ride.status) {
          case "w trakcie":
            message = "✓ Przejazd został zaakceptowany przez kierowcę!";
            break;
          case "odrzucone":
            message = "✗ Przejazd został odrzucony przez kierowcę.";
            break;
          case "zakonczone":
            message = "✓ Przejazd został zakończony pomyślnie.";
            break;
          default:
            message = `Status przejazdu: ${ride.status}`;
        }

        setStatusMessage(message);
        setStatusChanged(true);
        sessionStorage.setItem(
          "lastRideStatus_" + ride.zlecenie_id,
          ride.status
        );
      }
    }
  }, [ride?.status, ride?.zlecenie_id]);

  return (
    <IonApp>
      <IonPage>
        <IonHeader>
          <IonToolbar color="custom-grey">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle className="toolbar-logo-title">
              <img src="/assets/menu_logo.png" alt="MaxiTaxi Logo" />
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonLoading isOpen={isLoading} message="Proszę czekać..." />

          <IonToast
            isOpen={statusChanged}
            message={statusMessage || ""}
            duration={5000}
            position="top"
            color={
              statusMessage?.includes("zaakceptowany")
                ? "success"
                : statusMessage?.includes("odrzucony")
                ? "danger"
                : statusMessage?.includes("zakończony")
                ? "tertiary"
                : "primary"
            }
            onDidDismiss={() => setStatusChanged(false)}
            buttons={[
              {
                text: "OK",
                role: "cancel",
                handler: () => setStatusChanged(false),
              },
            ]}
            cssClass={`ride-status-toast ${
              statusMessage?.includes("zaakceptowany")
                ? "toast-success"
                : statusMessage?.includes("odrzucony")
                ? "toast-danger"
                : statusMessage?.includes("zakończony")
                ? "toast-tertiary"
                : ""
            }`}
            animated={true}
            mode="ios"
          />

          {error && (
            <IonCard>
              <IonCardContent>
                <IonText color="danger">{error}</IonText>
              </IonCardContent>
            </IonCard>
          )}

          {ride && (
            <IonGrid className="ride-detail-container">
              <IonRow>
                <IonCol size="12">
                  <h2 className="ride-title">Szczegóły przejazdu</h2>
                </IonCol>
              </IonRow>

              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Informacje o przejeździe</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none">
                    <IonItem>
                      <IonLabel>
                        <h2>Kierowca</h2>
                        <p>
                          {ride.kierowca_imie !== "NULL"
                            ? ride.kierowca_imie
                            : "Brak danych"}
                        </p>
                      </IonLabel>
                    </IonItem>

                    <IonItem>
                      <IonLabel>
                        <h2>Data zamówienia</h2>
                        <p>{new Date(ride.data_zamowienia).toLocaleString()}</p>
                      </IonLabel>
                    </IonItem>

                    <IonItem>
                      <IonLabel>
                        <h2>Dystans</h2>
                        <p>{parseFloat(ride.dystans_km).toFixed(2)} km</p>
                      </IonLabel>
                    </IonItem>

                    <IonItem>
                      <IonLabel>
                        <h2>Cena</h2>
                        <p>{parseFloat(ride.cena).toFixed(2)} zł</p>
                      </IonLabel>
                    </IonItem>

                    <IonItem>
                      <IonLabel>
                        <h2>Status</h2>
                        <p>{ride.status}</p>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              <IonRow>
                <IonCol size="12">
                  <h3 className="map-title">Trasa przejazdu</h3>
                  <div className="map-container" ref={mapRef}></div>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12" className="ion-text-center ion-padding">
                  {ride.status === "w trakcie" && (
                    <IonButton
                      color="success"
                      expand="block"
                      size="large"
                      onClick={handleCompleteRide}
                    >
                      Zakończ przejazd
                    </IonButton>
                  )}

                  {ride.status === "zlecono" && (
                    <IonButton
                      color="danger"
                      expand="block"
                      size="large"
                      onClick={handleCancelRide}
                    >
                      Anuluj przejazd
                    </IonButton>
                  )}

                  {ride.status === "anulowany" && (
                    <div className="ion-text-center ion-margin-vertical">
                      <IonText color="danger">
                        <p>
                          Przejazd został anulowany. Za chwilę nastąpi
                          przekierowanie...
                        </p>
                      </IonText>
                    </div>
                  )}

                  {(ride.status === "zakończony" ||
                    ride.status === "zamknięty") && (
                    <div className="ion-text-center ion-margin-vertical">
                      <IonText color="medium">
                        <p>Przejazd został zakończony.</p>
                      </IonText>
                    </div>
                  )}

                  <IonButton
                    color="medium"
                    expand="block"
                    size="default"
                    className="ion-margin-top"
                    onClick={() => handlePageChange("rides")}
                  >
                    Wróć do listy przejazdów
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}

          <IonModal isOpen={showPaymentModal}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Płatność za przejazd</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonText>
                <h2 className="ion-text-center">Płatności do implementacji</h2>
                <p className="ion-text-center">
                  {ride ? (
                    <PayPalButton
                      amount={parseFloat(ride.cena)}
                      rideId={ride.zlecenie_id}
                      sendEncryptedData={sendEncryptedData}
                      onSuccess={(details) => {
                        console.log("Payment completed successfully", details);
                        handlePayment();
                      }}
                      onError={(error) => {
                        console.error("Payment error", error);
                      }}
                    />
                  ) : (
                    <p>Ładowanie danych płatności...</p>
                  )}
                </p>
              </IonText>
              <div className="ion-padding-top ion-text-center">
                <IonButton onClick={handlePayment}>Kontynuuj</IonButton>
              </div>
            </IonContent>
          </IonModal>

          <IonModal isOpen={showRatingModal}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Oceń kierowcę</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              {ratingSuccess ? (
                <div className="ion-text-center ion-padding">
                  <IonText color="success">
                    <h2>{ratingSuccess}</h2>
                  </IonText>
                </div>
              ) : (
                <>
                  <h2 className="ion-text-center">Jak oceniasz przejazd?</h2>
                  <div className="rating-stars ion-text-center">
                    {renderStars()}
                  </div>
                  <IonItem className="ion-margin-top">
                    <IonLabel position="stacked">
                      Dodaj komentarz (opcjonalnie, max 100 znaków)
                    </IonLabel>
                    <IonTextarea
                      value={comment}
                      onIonInput={(e) => setComment((e.detail.value || "").slice(0, 100))}
                      placeholder="Twój komentarz..."
                      rows={3}
                      maxlength={100}
                      counter={true}
                      counterFormatter={(inputLength, maxLength) => `${inputLength}/${maxLength}`}
                    />
                  </IonItem>
                  {ratingError && (
                    <IonText color="danger">
                      <p className="ion-text-center ion-padding-top">
                        {ratingError}
                      </p>
                    </IonText>
                  )}
                  <div className="ion-padding-top ion-text-center">
                    <IonButton onClick={handleSubmitRating}>
                      Wyślij ocenę
                    </IonButton>
                  </div>
                </>
              )}
            </IonContent>
          </IonModal>
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default RideDetail;
