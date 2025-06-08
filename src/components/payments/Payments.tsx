import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonMenuButton,
  IonList,
  IonBadge,
  IonLoading,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonModal,
} from "@ionic/react";
import {
  cardOutline,
  addCircleOutline,
  carOutline,
  cashOutline,
  closeCircle,
} from "ionicons/icons";
import "./Payments.css";

import { Order } from "../../OrderInt";
import { Platnosc } from "../../Platnosc";

import PayPalButton from "./PayPalButton";

interface CardData {
  number: string;
  holder: string;
  expiry: string;
}

interface PaymentsProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>,
    method?: string
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const Payments: React.FC<PaymentsProps> = ({
  sendEncryptedData,
  getEncryptedData,
}) => {
  // States for rides and payments
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Platnosc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add states for the payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchRides = async () => {
    try {
      setIsLoading(true);
      const response = await getEncryptedData("zlecenia");

      if (response && Array.isArray(response)) {
        setOrders(response);
        console.log("Fetched rides:", response);
      } else {
        console.warn("Invalid ride data format received");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching rides:", error);
      setError("Nie udało się pobrać przejazdów");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await getEncryptedData("platnosci");

      if (response && Array.isArray(response)) {
        setPayments(response);
        console.log("Fetched payments:", response);
      } else {
        console.warn("Invalid payment data format received");
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Nie udało się pobrać historii płatności");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch both rides and payments data
  const fetchAllData = async () => {
    setError(null);
    setIsLoading(true);
    await Promise.all([fetchRides(), fetchPayments()]);
    setIsLoading(false);
  };

  // Load data when component mounts
  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = async (event: any) => {
    await fetchAllData();
    event.detail.complete();
  };

  // Handle opening the payment modal
  const handleOpenPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  // Handle successful payment
  const handlePaymentSuccess = (details: any) => {
    console.log("Payment successful:", details);
    setShowPaymentModal(false);
    fetchPayments(); // Refresh payments after successful payment
    fetchRides(); // Refresh rides to update statuses
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="custom-orange">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="toolbar-logo-title" />
          <IonTitle>Płatności</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="payments-background">
        <IonLoading isOpen={isLoading} message="Ładowanie danych..." />

        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {error && (
          <IonCard color="danger">
            <IonCardContent>{error}</IonCardContent>
          </IonCard>
        )}

        {/* Payment History */}
        <div className="payment-history-container">
          <h2 className="section-title">Historia płatności</h2>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <IonCard key={payment.id} className="payment-card">
                <IonCardHeader>
                  <IonCardTitle
                    className="payment-card-title"
                    style={{ color: "white" }}
                  >
                    Płatność nr: {payment.id}
                  </IonCardTitle>
                  <div className="payment-card-details">
                    <p>Przejazd nr: {payment.przejazd_id}</p>
                    <p>Kwota: {payment.kwota} zł</p>
                    <p>Data: {new Date(payment.data).toLocaleDateString()}</p>
                    <p>
                      <strong>Status:</strong> Opłacony
                    </p>
                  </div>
                </IonCardHeader>
              </IonCard>
            ))
          ) : (
            <p className="ion-text-center">Brak historii płatności</p>
          )}
        </div>

        {/* Unpaid Rides */}
        <div className="unpaid-rides-container">
          <h2 className="section-title">Przejazdy do opłacenia</h2>
          {(() => {
            // Funkcja sprawdzająca czy przejazd został opłacony
            const isRidePaid = (rideId: number) => {
              return payments.some((payment) => payment.przejazd_id === rideId);
            };

            // Filtruj przejazdy, które są zakończone i nie mają płatności
            const unpaidRides = orders.filter(
              (order) =>
                order.status === "zakonczone" && !isRidePaid(order.zlecenie_id)
            );

            if (unpaidRides.length > 0) {
              return unpaidRides.map((order) => (
                <IonCard key={order.zlecenie_id} className="ride-card">
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
                      <p>
                        <strong>Status:</strong> {order.status}
                      </p>
                      <p>
                        <strong>Stan Płatności:</strong>{" "}
                        <span className="payment-status-unpaid">
                          Nieopłacony
                        </span>
                      </p>
                      <IonButton
                        expand="block"
                        size="default"
                        className="pay-button"
                        onClick={() => handleOpenPaymentModal(order)}
                      >
                        Zapłać {order.cena} zł
                      </IonButton>
                    </div>
                  </IonCardHeader>
                </IonCard>
              ));
            } else {
              return (
                <p className="ion-text-center">Brak przejazdów do opłacenia</p>
              );
            }
          })()}
        </div>

        {/* Payment Modal */}
        <IonModal
          isOpen={showPaymentModal}
          onDidDismiss={() => setShowPaymentModal(false)}
        >
          <IonHeader>
            <IonToolbar color="custom-orange">
              <IonTitle>Płatność za przejazd</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPaymentModal(false)}>
                  <IonIcon icon={closeCircle} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedOrder && (
              <div className="payment-modal-content">
                <IonCard className="payment-summary">
                  <IonCardHeader>
                    <IonCardTitle>Podsumowanie płatności</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>
                      <strong>Przejazd nr:</strong> {selectedOrder.zlecenie_id}
                    </p>
                    <p>
                      <strong>Data:</strong>{" "}
                      {new Date(
                        selectedOrder.data_zamowienia
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Dystans:</strong> {selectedOrder.dystans_km} km
                    </p>
                    <p>
                      <strong>Do zapłaty:</strong> {selectedOrder.cena} zł
                    </p>
                  </IonCardContent>
                </IonCard>

                <h3 className="payment-method-title">
                  Wybierz metodę płatności:
                </h3>

                <PayPalButton
                  amount={parseFloat(selectedOrder.cena)}
                  rideId={selectedOrder.zlecenie_id}
                  sendEncryptedData={sendEncryptedData}
                  onSuccess={handlePaymentSuccess}
                  onError={(error) => {
                    console.error("Payment error:", error);
                  }}
                />

                <IonButton
                  expand="block"
                  color="medium"
                  onClick={() => setShowPaymentModal(false)}
                  className="cancel-payment-button"
                >
                  Anuluj
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Payments;
