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
} from "@ionic/react";
import { star, starOutline } from "ionicons/icons";

import "leaflet/dist/leaflet.css";
import polyline from "polyline";
import L from "leaflet";
import "./RideDetail.css";

interface Order {
  zlecenie_id: number;
  cena: string;
  data_zamowienia: string;
  data_zakonczenia: string | null;
  dystans_km: string;
  kierowca_id: number;
  kierowca_imie: string;
  pasazer_id: number;
  pasazer_imie: string;
  status: string;
  trasa_przejazdu: string;
}

interface RideDetailProps {
  sendEncryptedData: (endpoint: string, data: Record<string, unknown>, method?: string) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
  rideId: number;
  handlePageChange: (page: string) => void;
}

const RideDetail: React.FC<RideDetailProps> = ({
  sendEncryptedData,
  getEncryptedData,
  rideId,
  handlePageChange
}) => {
  const [ride, setRide] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingSuccess, setRatingSuccess] = useState<string | null>(null);
  
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  // Pobierz szczegóły przejazdu
  useEffect(() => {
    const fetchRideDetails = async () => {
      setIsLoading(true);
      try {
        const response = await getEncryptedData(`zlecenia`);
        const foundRide = response.find((r: Order) => r.zlecenie_id === rideId);
        
        if (foundRide) {
          setRide(foundRide);
        } else {
          setError("Nie znaleziono szczegółów przejazdu");
        }
      } catch (err) {
        console.error("Błąd pobierania szczegółów przejazdu:", err);
        setError("Wystąpił błąd podczas pobierania danych");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId, getEncryptedData]);

  // Inicjalizacja mapy i wyświetlenie trasy
  useEffect(() => {
    if (mapRef.current && ride?.trasa_przejazdu && !mapInstance.current) {
      // Inicjalizacja mapy
      const map = L.map(mapRef.current).setView([50.049683, 19.944544], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(map);
      
      mapInstance.current = map;

      try {
        // Dekodowanie polyline
        const decodedCoordinates = polyline.decode(ride.trasa_przejazdu);
        const routePoints = decodedCoordinates.map(
          coord => [coord[0], coord[1]] as [number, number]
        );
        
        if (routePoints.length > 0) {
          const routeLine = L.polyline(routePoints, { color: 'blue', weight: 5 }).addTo(map);
          
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
      } catch (err) {
        console.error("Błąd wyświetlania trasy:", err);
      }
    }

    // Cleanup funkcji gdy komponent zostanie odmontowany
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [ride]);

  // Funkcja zakończenia przejazdu
  const handleCompleteRide = async () => {
    setShowPaymentModal(true);
  };

  // Funkcja symulacji płatności
  const handlePayment = () => {
    setShowPaymentModal(false);
    setShowRatingModal(true);
  };

  // Funkcja obsługi oceny
  const handleSubmitRating = async () => {
    if (rating === 0) {
      setRatingError("Proszę wybrać ocenę");
      return;
    }

    if (!ride) return;

    try {
      setIsLoading(true);
      
      // Zmiana statusu przejazdu na zakończony (status_id = 3 to zakończony)
      await sendEncryptedData(
        `zlecenia/${ride.zlecenie_id}/status`, 
        { status_id: 3 },
        "PUT"  // Dodajemy metodę PUT
      );

      // Zapisanie oceny kierowcy
      await sendEncryptedData(
        "oceny", 
        {
          kierowca_id: ride.kierowca_id,
          przejazd_id: ride.zlecenie_id,
          ocena: rating,
          komentarz: comment
        }
      );

    await sendEncryptedData(
      "update-driver-rating",
      {
        kierowca_id: ride.kierowca_id
      }
    );

      setRatingSuccess("Dziękujemy za ocenę!");
      
      // Po 2 sekundach zamknij modal i wróć do mapy
      setTimeout(() => {
        setShowRatingModal(false);
        handlePageChange("map");
      }, 2000);
      
    } catch (err) {
      console.error("Błąd podczas zapisywania oceny:", err);
      setRatingError("Wystąpił błąd podczas zapisywania oceny");
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja anulowania przejazdu 
  const handleCancelRide = async () => {
    if (!ride) return;

    try {
      setIsLoading(true);
      
      // Zmiana statusu przejazdu na anulowany (status_id = 4 to anulowany)
      await sendEncryptedData(
        `zlecenia/${ride.zlecenie_id}/status`, 
        { status_id: 4 },
        "PUT"  
      );

      setRatingSuccess("Przejazd został anulowany.");
      
      // Po 2 sekundach wróć do mapy
      setTimeout(() => {
        handlePageChange("map");
      }, 2000);
      
    } catch (err) {
      console.error("Błąd podczas anulowania przejazdu:", err);
      setRatingError("Wystąpił błąd podczas anulowania przejazdu");
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja renderowania gwiazdek
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IonIcon
          key={i}
          icon={i <= rating ? star : starOutline}
          className="rating-star"
          onClick={() => setRating(i)}
        />
      );
    }
    return stars;
  };

  return (
    <IonApp>
      <IonPage>
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
          <IonLoading isOpen={isLoading} message={"Proszę czekać..."} />
          
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
                        <p>{ride.kierowca_imie !== "NULL" ? ride.kierowca_imie : "Brak danych"}</p>
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
              
              {ride && (
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
              )}
            </IonGrid>
          )}
          
          {/* Modal płatności */}
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
                  W tym miejscu zostanie zaimplementowana obsługa płatności.
                </p>
              </IonText>
              <div className="ion-padding-top ion-text-center">
                <IonButton onClick={handlePayment}>
                  Kontynuuj
                </IonButton>
              </div>
            </IonContent>
          </IonModal>
          
          {/* Modal oceny */}
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
                    <IonLabel position="stacked">Dodaj komentarz (opcjonalnie)</IonLabel>
                    <IonTextarea
                      value={comment}
                      onIonInput={e => setComment(e.detail.value || "")}
                      placeholder="Twój komentarz..."
                      rows={4}
                    />
                  </IonItem>
                  
                  {ratingError && (
                    <IonText color="danger">
                      <p className="ion-text-center ion-padding-top">{ratingError}</p>
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