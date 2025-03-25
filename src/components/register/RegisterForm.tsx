import React, { useRef, useState } from "react";
import {
  IonApp,
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonInput,
  IonItem,
  IonLabel,
  IonRow,
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./RegisterForm.css";

const RegisterForm: React.FC = () => {
  const emailRef = useRef<HTMLIonInputElement>(null);
  const passRef = useRef<HTMLIonInputElement>(null);
  const confirmRef = useRef<HTMLIonInputElement>(null);

  const [error, setError] = useState("");
  const history = useHistory();

  const handleRegister = () => {
    const email = emailRef.current?.value?.toString().trim();
    const password = passRef.current?.value?.toString().trim();
    const confirm = confirmRef.current?.value?.toString().trim();

    if (!email || !password || !confirm) {
      setError("Wszystkie pola są wymagane.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Podaj poprawny adres email.");
      return;
    }

    if (password.length < 6) {
      setError("Hasło musi mieć min. 6 znaków.");
      return;
    }

    if (password !== confirm) {
      setError("Hasła nie są zgodne.");
      return;
    }

    console.log("Zarejestrowano:", email);
    
    history.push("/login");
  };

  const goToLogin = () => {
    history.push("/login");
  };

  const SERVER = "localhost:8080"
  
  const SALT = "tjM6O3MeXFEHUPOj"



  const emailInputRef = useRef<HTMLIonInputElement>(null);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLIonInputElement>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const validateForm = () => {
    let isValid = true;

    // Walidacja email
    const email = String(emailInputRef.current!.value).trim();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(null);
    }

    // Walidacja hasła
    const password = String(passwordInputRef.current!.value).trim();
    if (!password || password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(null);
    }

    // Walidacja potwierdzenia hasła (tylko w trybie rejestracji)
    if (isRegistering) {
      const confirmPassword = String(
        confirmPasswordInputRef.current!.value
      ).trim();
      if (!confirmPassword || confirmPassword !== password) {
        setConfirmPasswordError("Passwords do not match.");
        isValid = false;
      } else {
        setConfirmPasswordError(null);
      }
    }

    return isValid;
  };

  async function hashData(data: string) {
    const encoder = new TextEncoder(); // Tworzymy encoder do kodowania tekstu
    const dataBuffer = encoder.encode(data); // Przekształcamy tekst w array buffer

    // Używamy algorytmu SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

    // Konwertujemy wynik (ArrayBuffer) na string w formacie heksadecymalnym
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Zamiana na tablicę bajtów
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(""); // Przekształcenie w hex

    return hashHex; // Zwracamy wynik
  }

  const hashPassword = async (password: string, salt: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  async function generateKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("my_secret_key_16"), // 16 bajtów
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );
  }
  
  async function encryptData(data: Record<string, unknown>): Promise<{ iv: number[]; data: number[] }> {
    const key = await generateKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      new TextEncoder().encode(JSON.stringify(data))
    );
    return { iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
  }
  
  async function sendEncryptedData(endpoint: string, data: Record<string, unknown>): Promise<void> {
    const encryptedPayload = await encryptData(data);
    await fetch(`${SERVER}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(encryptedPayload),
    });
  }
  
  const register = async (): Promise<void> => {
    if (validateForm()) {
      const email = String(emailInputRef.current?.value ?? "").trim();
      const password = await hashPassword(String(passwordInputRef.current?.value ?? "").trim(), SALT);
      await sendEncryptedData("register", { user: email, password });
    }
  };
  
  const handleRegisterClick = () => {
    setIsRegistering(true); // Przełączamy tryb na rejestrację
  };

  return (
    <IonApp>
      <IonContent className="register-background">
        <div className="register-logo">
          <img src="/assets/taxi-white.png" alt="Taxi Logo" />
        </div>

        <IonText className="register-welcome-text">
          <h2>Rejestracja</h2>
        </IonText>

        <div className="register-spacer" />

        <IonGrid className="register-form">
          <IonRow>
            <IonCol>
              <IonItem className="register-input">
                <IonLabel position="floating">Email</IonLabel>
                <IonInput ref={emailRef} type="email" />
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem className="register-input">
                <IonLabel position="floating">Hasło</IonLabel>
                <IonInput ref={passRef} type="password" />
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem className="register-input">
                <IonLabel position="floating">Potwierdź hasło</IonLabel>
                <IonInput ref={confirmRef} type="password" />
              </IonItem>
            </IonCol>
          </IonRow>

          {error && (
            <IonRow>
              <IonCol>
                <IonText color="danger"><p>{error}</p></IonText>
              </IonCol>
            </IonRow>
          )}

          <IonRow>
            <IonCol>
              <IonButton expand="block" className="register-button" onClick={handleRegister}>
                ZAREJESTRUJ
              </IonButton>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol className="ion-text-center">
              <IonText color="light">
                <small>
                  Masz już konto?{" "}
                  <span
                    className="register-link"
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={goToLogin}
                  >
                    Zaloguj się
                  </span>
                </small>
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>
        <div className="register-bottom-image">
        <img src="public/assets/login-dol.png" alt="Rejestracja stopka" />
        </div>
      </IonContent>
    </IonApp>
  );
};

export default RegisterForm;
