import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonRow,
  IonCol,
  IonModal,
  IonAlert,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";


const API_URL = import.meta.env.VITE_REACT_APP_API_URL;
const SALT = import.meta.env.VITE_REACT_APP_SALT || "";

type ProfileData = {
  imie: string;
  email: string;
  telefon: string;
  data_utworzenia: string;
};

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editData, setEditData] = useState({ imie: "", telefon: "" });
  const [editMode, setEditMode] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

// Funkcja hashująca znowu ponieważ nie działa ta zaimportowana z autentication
const hashPassword = async (password: string, salt: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Błąd pobierania profilu");
      const data = await res.json();
      setProfile(data);
      setEditData({ imie: data.imie || "", telefon: data.telefon || "" });
    } catch {
      setMsg("Błąd ładowania profilu");
    }
  };

  const handleEdit = () => setEditMode(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!validate()) return; 
    try {
      const token = localStorage.getItem("jwt");
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Błąd zapisu");
      setProfile((prev) => prev && { ...prev, ...editData });
      setEditMode(false);
      setMsg("Zapisano zmiany");
    } catch {
      setMsg("Błąd zapisu");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!passwords.newPassword || passwords.newPassword.length < 6) {
      setMsg("Nowe hasło musi mieć co najmniej 6 znaków.");
      setShowPasswordModal(false);
      return;
    }
  
    try {
      const token = localStorage.getItem("jwt");
      const oldPassword = await hashPassword(String(passwords.oldPassword ?? "").trim(), SALT);
      const newPassword = await hashPassword(String(passwords.newPassword ?? "").trim(), SALT);
  
      const res = await fetch(`${API_URL}/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd zmiany hasła");
      setMsg("Hasło zmienione");
      setPasswords({ oldPassword: "", newPassword: "" });
      setShowPasswordModal(false);
    } catch (err: any) {
      setMsg(err.message || "Błąd zmiany hasła");
      setShowPasswordModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const res = await fetch(`${API_URL}/profile`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Błąd usuwania konta");
      localStorage.removeItem("jwt");
      window.location.reload();
    } catch {
      setMsg("Błąd usuwania konta");
    }
  };

  const [errors, setErrors] = useState<{ imie?: string; telefon?: string }>({});

  // Walidacja danych
  const validate = () => {
    const newErrors: { imie?: string; telefon?: string } = {};
    if (!editData.imie || editData.imie.trim().length < 2) {
      newErrors.imie = "Imię musi mieć co najmniej 2 znaki.";
    }
    if (editData.telefon && !/^\d+$/.test(editData.telefon)) {
      newErrors.telefon = "Numer telefonu może zawierać tylko cyfry.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  


  if (!profile) return <div>Ładowanie...</div>;

  return (
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
      <IonContent className="ion-padding">
        {msg && <IonText color="danger"><p>{msg}</p></IonText>}
        <IonItem>
  <IonLabel position="stacked">Imię</IonLabel>
  {editMode ? (
    <>
      <IonInput
        name="imie"
        value={editData.imie}
        onIonInput={e => handleChange(e as any)}
      />
      {errors.imie && (
        <IonText color="danger"><p>{errors.imie}</p></IonText>
      )}
    </>
  ) : (
    <IonText>{profile.imie}</IonText>
  )}
</IonItem>
<IonItem>
  <IonLabel position="stacked">Telefon</IonLabel>
  {editMode ? (
    <>
      <IonInput
        name="telefon"
        value={editData.telefon}
        onIonInput={e => handleChange(e as any)}
      />
      {errors.telefon && (
        <IonText color="danger"><p>{errors.telefon}</p></IonText>
      )}
    </>
  ) : (
    <IonText>{profile.telefon}</IonText>
  )}
</IonItem>
        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput value={profile.email} disabled />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Data utworzenia</IonLabel>
          <IonInput value={new Date(profile.data_utworzenia).toLocaleString()} disabled />
        </IonItem>
        <IonRow>
          <IonCol>
            {editMode ? (
              <>
                <IonButton expand="block" onClick={handleSave}>Zapisz</IonButton>
                <IonButton expand="block" fill="clear" onClick={() => setEditMode(false)}>Anuluj</IonButton>
              </>
            ) : (
              <IonButton expand="block" onClick={handleEdit}>Edytuj dane</IonButton>
            )}
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton expand="block" color="medium" onClick={() => setShowPasswordModal(true)}>
              Zmień hasło
            </IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton expand="block" color="danger" onClick={() => setShowDeleteAlert(true)}>
              Usuń konto
            </IonButton>
          </IonCol>
        </IonRow>
        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonContent className="ion-padding">
            <form onSubmit={handlePasswordChange}>
              <IonItem>
                <IonLabel position="stacked">Stare hasło</IonLabel>
                <IonInput
                  type="password"
                  value={passwords.oldPassword}
                  onIonInput={e => setPasswords({ ...passwords, oldPassword: e.detail.value! })}
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Nowe hasło</IonLabel>
                <IonInput
                  type="password"
                  value={passwords.newPassword}
                  onIonInput={e => setPasswords({ ...passwords, newPassword: e.detail.value! })}
                  required
                />
              </IonItem>
              <IonButton expand="block" type="submit">Zmień hasło</IonButton>
              <IonButton expand="block" fill="clear" onClick={() => setShowPasswordModal(false)}>
                Anuluj
              </IonButton>
            </form>
          </IonContent>
        </IonModal>
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Potwierdź usunięcie"
          message="Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć."
          buttons={[
            {
              text: "Anuluj",
              role: "cancel",
            },
            {
              text: "Usuń",
              role: "destructive",
              handler: handleDeleteAccount,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;