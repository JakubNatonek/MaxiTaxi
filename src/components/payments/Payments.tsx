import React, { useState } from "react";
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
} from "@ionic/react";
import { cardOutline, addCircleOutline } from "ionicons/icons";
import "./Payments.css";

interface CardData {
  number: string;
  holder: string;
  expiry: string;
}

const Payments: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cards, setCards] = useState<CardData[]>([]); // ⬅️ Tablica kart

  const handleAddCard = () => {
    if (cardNumber && cardHolder && expiry && cvc) {
      const newCard: CardData = {
        number: cardNumber,
        holder: cardHolder,
        expiry: expiry,
      };
      setCards([...cards, newCard]);
      setCardNumber("");
      setCardHolder("");
      setExpiry("");
      setCvc("");
      setShowForm(false);
    } else {
      alert("Uzupełnij wszystkie pola");
    }
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
        <IonCard className="credit-card">
          <IonCardHeader>
            <IonCardTitle>Twoja główna karta</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="card-visual">
              <div className="chip" />
              <div className="card-number">**** **** **** 1234</div>
              <div className="card-details">
                <span className="card-holder">JAN KOWALSKI</span>
                <span className="card-expiry">12/27</span>
              </div>
            </div>

            <IonItem lines="none">
              <IonIcon icon={cardOutline} slot="start" />
              <IonLabel>Visa – ostatnie cyfry: 1234</IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {!showForm && (
          <IonButton expand="block" onClick={() => setShowForm(true)}>
            <IonIcon icon={addCircleOutline} slot="start" />
            Dodaj nową kartę
          </IonButton>
        )}

        {showForm && (
          <IonCard className="add-card-form">
            <IonCardHeader>
              <IonCardTitle>Dodaj nową kartę</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="floating">Numer karty</IonLabel>
                <IonInput
                  value={cardNumber}
                  onIonChange={(e) => setCardNumber(e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Właściciel</IonLabel>
                <IonInput
                  value={cardHolder}
                  onIonChange={(e) => setCardHolder(e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Data ważności</IonLabel>
                <IonInput
                  value={expiry}
                  onIonChange={(e) => setExpiry(e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">CVC</IonLabel>
                <IonInput
                  value={cvc}
                  onIonChange={(e) => setCvc(e.detail.value!)}
                  type="password"
                />
              </IonItem>
              <IonButton expand="block" onClick={handleAddCard} className="save-button">
                Zapisz kartę
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* Lista dodatkowych kart */}
        {cards.length > 0 && (
          <div className="extra-cards">
            <h3>Inne zapisane karty:</h3>
            {cards.map((card, index) => (
              <IonCard key={index} className="credit-card small">
                <IonCardContent>
                  <div className="card-visual">
                    <div className="chip" />
                    <div className="card-number">
                      **** **** **** {card.number.slice(-4)}
                    </div>
                    <div className="card-details">
                      <span className="card-holder">{card.holder}</span>
                      <span className="card-expiry">{card.expiry}</span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Payments;
