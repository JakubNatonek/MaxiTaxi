import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonToast,
  IonLoading,
} from "@ionic/react";
import "./Payments.css"; // <— import Twoich styli

interface Card {
  id: number;
  number: string;
  expiry: string;
  holder: string;
}

interface PaymentsProps {
  sendEncryptedData: (endpoint: string, data: Record<string, unknown>) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:8080";

const Payments: React.FC<PaymentsProps> = ({ sendEncryptedData, getEncryptedData }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [holder, setHolder] = useState("");

  const [toast, setToast] = useState<{ open: boolean; msg: string }>({ open: false, msg: "" });

  // 1. Pobierz istniejące karty
  const fetchList = async () => {
    setBusy(true);
    try {
      const data = (await getEncryptedData("karty")) as Card[];
      setCards(data);
    } catch (e: any) {
      console.error("Błąd pobierania kart:", e);
      setToast({ open: true, msg: "Błąd pobierania kart" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // 2. Dodaj kartę (bez czyszczenia pól)
  const handleAdd = async () => {
    if (!number.trim() || !expiry.trim() || !holder.trim()) {
      setToast({ open: true, msg: "Wypełnij wszystkie pola" });
      return;
    }
    const numClean = number.replace(/\s+/g, "");
    if (!/^\d{16}$/.test(numClean)) {
      setToast({ open: true, msg: "Numer karty musi mieć 16 cyfr" });
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setToast({ open: true, msg: "Data ważności w formacie MM/YY" });
      return;
    }

    try {
      await sendEncryptedData("karty", { number: numClean, expiry, holder });
      setToast({ open: true, msg: "Karta dodana" });
      await fetchList();
      // tutaj NIE czyścimy number/expiry/holder – użytkownik może natychmiast dodać kolejną
    } catch (e: any) {
      console.error("Błąd dodawania karty:", e);
      setToast({ open: true, msg: e.message || "Błąd dodawania karty" });
    }
  };

  // 3. Usuń kartę
  const handleRemove = async (id: number) => {
    const token = localStorage.getItem("jwt") || "";
    try {
      const resp = await fetch(`${SERVER}/karty/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || resp.statusText);
      }
      setToast({ open: true, msg: "Karta usunięta" });
      await fetchList();
    } catch (e: any) {
      console.error("Błąd usuwania karty:", e);
      setToast({ open: true, msg: e.message || "Błąd usuwania karty" });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Moje karty</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">

        {/* Przełącznik formularza */}
        <IonButton expand="full" onClick={() => setShowForm(f => !f)}>
          {showForm ? "Anuluj" : "Dodaj kartę"}
        </IonButton>

        {/* Formularz dodawania */}
        {showForm && (
          <div className="add-card-form">
            {/* Podgląd */}
            <div className="credit-card">
              <div className="card-visual">
                <div className="chip"></div>
                <div className="card-number">
                  {number
                    ? number.replace(/(\d{4})(?=\d)/g, "$1 ")
                    : "•••• •••• •••• ••••"}
                </div>
                <div className="card-details">
                  <span>{holder || "Imię Nazwisko"}</span>
                  <span>{expiry || "MM/YY"}</span>
                </div>
              </div>

              {/* Pola */}
              <IonItem>
                <IonLabel position="stacked">Numer karty</IonLabel>
                <IonInput
                  value={number}
                  placeholder="1234 5678 9012 3456"
                  maxlength={19}
                  onIonChange={e => setNumber(e.detail.value || "")}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Data ważności (MM/YY)</IonLabel>
                <IonInput
                  value={expiry}
                  placeholder="MM/YY"
                  onIonChange={e => setExpiry(e.detail.value || "")}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Właściciel karty</IonLabel>
                <IonInput
                  value={holder}
                  placeholder="Jan Kowalski"
                  onIonChange={e => setHolder(e.detail.value || "")}
                />
              </IonItem>

              <IonButton
                className="save-button"
                expand="full"
                onClick={handleAdd}
                disabled={busy}
              >
                Zapisz kartę
              </IonButton>
            </div>
          </div>
        )}

        <IonLoading isOpen={busy} message="Ładowanie kart..." />

        {/* Lista zapisanych kart */}
        <IonList>
          {cards.map(c => (
            <IonItem key={c.id} className="card-item">
              <IonLabel>
                <div className="card-mask">**** **** **** {c.number.slice(-4)}</div>
                <div className="card-holder">{c.holder}</div>
                <div className="card-expiry">ważna do {c.expiry}</div>
              </IonLabel>
              <IonButton
                slot="end"
                color="danger"
                size="small"
                onClick={() => handleRemove(c.id)}
              >
                Usuń
              </IonButton>
            </IonItem>
          ))}
          {!busy && cards.length === 0 && <p>Brak zapisanych kart.</p>}
        </IonList>

        <IonToast
          isOpen={toast.open}
          message={toast.msg}
          duration={3000}
          onDidDismiss={() => setToast(t => ({ ...t, open: false }))}
        />
      </IonContent>
    </IonPage>
  );
};

export default Payments;
