import React, { useRef, useEffect, useState } from "react";
import {
  IonModal,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonList,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonBadge,
  IonSpinner,
} from "@ionic/react";
import {
  carOutline,
  cashOutline,
  timeOutline,
  navigateOutline,
  colorPaletteOutline,
  cardOutline,
} from "ionicons/icons";

import polyline from "polyline";
import "./BookingMenu.css";
import { Driver } from "../../Driver";



interface BookingMenuProps {
  size: number;
  openIs: boolean;
  setShowBooking: React.Dispatch<React.SetStateAction<boolean>>;
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
  handlePageChange: (page: string, params?: any) => void;
  routeData: any;
}


const BookingMenu: React.FC<BookingMenuProps> = ({
  size,
  openIs,
  setShowBooking,
  sendEncryptedData,
  getEncryptedData,
  routeData,
  handlePageChange
}) => {
  const [listDrivers, setListDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [selectedDriverDetails, setSelectedDriverDetails] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const modalRef = useRef<HTMLIonModalElement>(null);

  useEffect(() => {
    // console.log(routeData);
    const modalEl = modalRef.current;

    const handleBackdropTap = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      modalEl?.setCurrentBreakpoint(0.05);
    };

    if (modalEl) {
      modalEl.addEventListener("ionBackdropTap", handleBackdropTap);
    }
    return () => {
      modalEl?.removeEventListener("ionBackdropTap", handleBackdropTap);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sprawdzanie wartości routeData przed rozpoczęciem asynchronicznej operacji
        if (routeData) {
          setIsLoading(true);
          setSelectedDriver(null); // Resetowanie wybranego kierowcy
          setSelectedDriverDetails(null);
          const data = await getEncryptedData("bliscy");
          setListDrivers(data);
          // console.log(data);
          // Możesz ustawić stan lub wykonać inne operacje z danymi
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Błąd:", error);
        setIsLoading(false);
      }
    };

    fetchData(); // Wywołanie funkcji asynchronicznej
  }, [routeData, getEncryptedData]); // Efekt wywołany za każdym razem, gdy routeData się zmienia

  const handleSelectedDriver = (driverId: number) => {
    // console.log(driverId);
    setSelectedDriver(driverId);
    const driverDetails = listDrivers.find(driver => driver.uzytkownik_id === driverId);
    setSelectedDriverDetails(driverDetails || null);
  };

  const handleOrderRide = async () => {
    // Opłata startowa	5,00 – 8,00 zł
    // Taryfa 1 (dzień 6:00 – 22:00)	1,50 – 3,00 zł / km
    // Taryfa 2 (noc 22:00 – 6:00)	2,50 – 4,50 zł / km
    // Taryfa 3 (dzień 6:00 - 22:00)	4,00 – 6,00 zł / km
    // Taryfa 4 (noc 22:00 – 6:00)	5,00 – 9,00 zł / km
    // Postój	25,00 - 50,00 / godz.
    const data = {
      kierowca_id: selectedDriver,
      dystans_km: (routeData.routes[0].distance / 1000).toFixed(2),
      trasa_przejazdu: routeData.routes[0].geometry,
      cena: ((routeData.routes[0].distance * 4.5) / 1000 + 8).toFixed(2),
      status_id: 1,
    };
    try {
      const response = await sendEncryptedData("zlecenia", data);
    
      const ridesResponse = await getEncryptedData("zlecenia");

      const latestRide = ridesResponse.sort((a: any, b: any) => {
        return new Date(b.data_zamowienia).getTime() - new Date(a.data_zamowienia).getTime();
      })[0];
    
      setShowBooking(false);

      handlePageChange("rideDetail", { rideId: latestRide.zlecenie_id });

    } catch (error) {
      console.error("Błąd podczas zamawiania przejazdu:", error);
    }
  };

  return (
    <IonModal
      ref={modalRef}
      isOpen={openIs}
      handleBehavior="cycle"
      onDidDismiss={() => setShowBooking(false)}
      className="booking-modal"
    >
      <IonCard className="header-card">
        <IonCardHeader>
          <IonCardTitle className="main-title">Zamówienie przejazdu</IonCardTitle>
        </IonCardHeader>
      </IonCard>
      
      <IonGrid className="booking-content">
        <IonRow>
          <IonCol>
            <IonCard className="booking-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={carOutline} className="card-icon" />
                  Wybierz kierowcę
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {isLoading ? (
                  <div className="loading-container">
                    <IonSpinner name="crescent" />
                    <p>Wyszukiwanie dostępnych kierowców...</p>
                  </div>
                ) : (
                  <>
                    <IonSelect
                      interface="action-sheet"
                      placeholder="Wybierz kierowcę"
                      onIonChange={(e) => handleSelectedDriver(e.detail.value)}
                      className="driver-select"
                    >
                      {listDrivers && listDrivers.length > 0 ? (
                        listDrivers.map((driver) => (
                          <IonSelectOption
                            key={driver.uzytkownik_id}
                            value={driver.uzytkownik_id}
                          >
                            {driver.imie_kierowcy !== "NULL"
                              ? `${driver.imie_kierowcy} : ${driver.dystans_km.toFixed(2)} km`
                              : "Brak kierowców"}
                          </IonSelectOption>
                        ))
                      ) : (
                        <IonSelectOption disabled>Brak kierowców</IonSelectOption>
                      )}
                    </IonSelect>
                    
                    {selectedDriverDetails && (
                      <div className="driver-details">
                        <div className="driver-name">
                          <h3>{selectedDriverDetails.imie_kierowcy !== "NULL" ? 
                              selectedDriverDetails.imie_kierowcy : "Kierowca"}</h3>
                          <IonBadge color="success" className="distance-badge">
                            {selectedDriverDetails.dystans_km.toFixed(2)} km
                          </IonBadge>
                        </div>
                        
                        <div className="car-details">
                          {selectedDriverDetails.model_pojazdu && (
                            <div className="detail-item">
                              <IonIcon icon={carOutline} />
                              <span>Model: {selectedDriverDetails.model_pojazdu}</span>
                            </div>
                          )}
                          {selectedDriverDetails.nr_rejestracyjny && (
                            <div className="detail-item">
                              <IonIcon icon={cardOutline} />
                              <span>Nr rej.: {selectedDriverDetails.nr_rejestracyjny}</span>
                            </div>
                          )}
                          {selectedDriverDetails.kolor_pojazdu && (
                            <div className="detail-item">
                              <IonIcon icon={colorPaletteOutline} />
                              <span>Kolor: {selectedDriverDetails.kolor_pojazdu}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol>
            <IonCard className="booking-card">
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={navigateOutline} className="card-icon" />
                  Szczegóły trasy
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="route-details">
                  <div className="detail-group">
                    <div className="detail-label">
                      <IonIcon icon={navigateOutline} />
                      <span>Długość trasy</span>
                    </div>
                    <div className="detail-value">
                      {routeData?.routes?.[0]?.distance
                        ? `${(routeData.routes[0].distance / 1000).toFixed(2)} km`
                        : "N/A"}
                    </div>
                  </div>

                  <div className="detail-group">
                    <div className="detail-label">
                      <IonIcon icon={timeOutline} />
                      <span>Czas przejazdu</span>
                    </div>
                    <div className="detail-value">
                      {routeData?.routes?.[0]?.duration
                        ? `${Math.floor(routeData.routes[0].duration / 60)} min`
                        : "N/A"}
                    </div>
                  </div>

                  <div className="detail-group price-group">
                    <div className="detail-label">
                      <IonIcon icon={cashOutline} />
                      <span>Szacowana cena</span>
                    </div>
                    <div className="detail-value price-value">
                      {routeData?.routes?.[0]?.distance
                        ? `${((routeData.routes[0].distance * 4.5) / 1000 + 8).toFixed(2)} zł`
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow className="booking-actions">
          <IonCol>
            <IonButton
              expand="block"
              color="primary"
              onClick={handleOrderRide}
              disabled={!selectedDriver}
              className="order-button"
            >
              Zamów przejazd
            </IonButton>
          </IonCol>
        </IonRow>

        <IonRow className="booking-actions">
          <IonCol>
            <IonButton
              expand="block"
              color="medium"
              fill="outline"
              onClick={() => setShowBooking(false)}
              className="cancel-button"
            >
              Anuluj zamówienie
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonModal>
  );
};

export default BookingMenu;
