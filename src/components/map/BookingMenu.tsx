import React, { useRef, useEffect, useState } from "react";
import {
  IonModal,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonList,
} from "@ionic/react";

import polyline from "polyline";

interface BookingMenuProps {
  size: number;
  openIs: boolean;
  setShowBooking: React.Dispatch<React.SetStateAction<boolean>>;
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
  routeData: any;
}

const BookingMenu: React.FC<BookingMenuProps> = ({
  size,
  openIs,
  setShowBooking,
  sendEncryptedData,
  getEncryptedData,
  routeData,
}) => {
  const [listDrivers, setListDrivers] = useState<
    { uzytkownik_id: number; imie_kierowcy: string; dystans_km: number }[]
  >([]);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  const modalRef = useRef<HTMLIonModalElement>(null);

  useEffect(() => {
    console.log(routeData);
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
          setSelectedDriver(null); // Resetowanie wybranego kierowcy
          const data = await getEncryptedData("bliscy");
          setListDrivers(data);
          // console.log(data);
          // Możesz ustawić stan lub wykonać inne operacje z danymi
        }
      } catch (error) {
        console.error("Błąd:", error);
      }
    };

    fetchData(); // Wywołanie funkcji asynchronicznej
  }, [routeData]); // Efekt wywołany za każdym razem, gdy routeData się zmienia

  const handleSelectedDriver = (driverId: number) => {
    // console.log(driverId);
    setSelectedDriver(driverId);
  };

  const handleOrderRide = () => {
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
    sendEncryptedData("zlecenia", data);
  };

  return (
    <IonModal
      ref={modalRef}
      isOpen={openIs}
      handleBehavior="cycle"
      onDidDismiss={() => setShowBooking(false)}
    >
      <div style={{ height: "30px" }}></div>
      <IonItem>
        <IonLabel>Wybierz kierowcę</IonLabel>
        <IonList>
          <IonItem>
            <IonSelect
              interface="popover"
              placeholder="Wybierz kierowcę"
              onIonChange={(e) => handleSelectedDriver(e.detail.value)}
            >
              {listDrivers && listDrivers.length > 0 ? (
                listDrivers.map((driver) => (
                  <IonSelectOption
                    key={driver.uzytkownik_id}
                    value={driver.uzytkownik_id}
                  >
                    {driver.imie_kierowcy !== "NULL"
                      ? `${driver.imie_kierowcy} : ${driver.dystans_km.toFixed(
                          2
                        )} km`
                      : "Brak kierowców"}
                  </IonSelectOption>
                ))
              ) : (
                <IonSelectOption disabled>Brak kierowców</IonSelectOption>
              )}
            </IonSelect>
          </IonItem>
        </IonList>
      </IonItem>
      <IonItem>
        <IonLabel>Przewidywana długośąć trasy</IonLabel>
        <IonLabel>
          {routeData?.routes?.[0]?.distance
            ? `${(routeData.routes[0].distance / 1000).toFixed(2)} Km`
            : "N/A"}
        </IonLabel>
      </IonItem>
      <IonItem>
        <IonLabel>Przewidywany czas przyjazdu</IonLabel>
        <IonLabel>
          {routeData?.routes?.[0]?.duration
            ? `${Math.floor(routeData.routes[0].duration / 60)} min`
            : "N/A"}
        </IonLabel>
      </IonItem>
      <IonItem>
        <IonLabel>Przewidywana cena</IonLabel>
        <IonLabel>
          {routeData?.routes?.[0]?.distance
            ? `${((routeData.routes[0].distance * 4.5) / 1000 + 8).toFixed(
                2
              )} Zł`
            : "N/A"}
        </IonLabel>
      </IonItem>
      <IonButton
        expand="full"
        color="primary"
        onClick={() => {
          handleOrderRide();
        }}
      >
        Zamów przejazd
      </IonButton>
      <IonButton
        expand="full"
        color="primary"
        onClick={() => {
          setShowBooking(false);
        }}
      >
        Anuluj zamówienie
      </IonButton>
    </IonModal>
  );
};

export default BookingMenu;
