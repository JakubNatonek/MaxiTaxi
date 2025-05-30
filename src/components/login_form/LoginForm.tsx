import React, { useState, useRef } from "react";
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
import "./LoginForm.css";

const SALT = import.meta.env.VITE_REACT_APP_SALT || ""; //DO USUNIĘCIA

interface LoginFormProps {
  SERVER: string;
  onLoginStateChange: (isLogin: boolean) => void;
  handlePageChange: (page: string) => void;
  hashPassword: (password: string, salt: string) => Promise<string>;
  sendEncryptedData:  (endpoint: string, data: Record<string, unknown>) => Promise<any>;
}

const LoginForm: React.FC<LoginFormProps> = ({ SERVER, onLoginStateChange, handlePageChange, hashPassword, sendEncryptedData }) => {

  const emailInputRef = useRef<HTMLIonInputElement>(null);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // Dodaj stan do przechowywania błędów logowania
  const [loginError, setLoginError] = useState<string | null>(null);

  const validateForm = () => {
    const email = String(emailInputRef.current!.value).trim();
    const password = String(passwordInputRef.current!.value).trim();

    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Proszę podać prawidłowy adres e-mail.");
      isValid = false;
    } else {
      setEmailError(null);
    }

    if (!password || password.length < 6) {
      setPasswordError("Hasło musi mieć co najmniej 6 znaków.");
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handle_login = async () => {
    // Resetuj ewentualne poprzednie błędy logowania
    setLoginError(null);
    
    if (validateForm()) {
      const email = String(emailInputRef.current?.value ?? "").trim();
      const password = await hashPassword(String(passwordInputRef.current?.value ?? "").trim(), SALT);
  
      try {
        const result = await sendEncryptedData("login", { user: email, password });
        localStorage.setItem("jwt", result.token); // Przechowaj token JWT
        onLoginStateChange(true);
      } catch (error: any) {
        // Wyświetl komunikat błędu z serwera jeśli istnieje
        if (error.message) {
          setLoginError(error.message);
        } else {
          setLoginError("Wystąpił błąd podczas logowania. Spróbuj ponownie.");
        }
        console.error("Login failed:", error);
      }
    }
  };

  return (
    <IonApp>
      <IonContent className="login-background">
        <div className="login-logo">
          <img src="/assets/taxi-white.png" alt="Taxi Logo" />
        </div>

        <IonText className="login-welcome-text">
          <h2>Miło Cię widzieć!</h2>
        </IonText>

        <div className="login-spacer" />

        <IonGrid className="login-form">
          {/* Dodaj wyświetlanie błędu logowania na górze formularza */}
          {loginError && (
            <IonRow>
              <IonCol>
                <IonText color="danger" className="ion-text-center">
                  <p><strong>{loginError}</strong></p>
                </IonText>
              </IonCol>
            </IonRow>
          )}
          
          <IonRow>
            <IonCol>
              <IonItem className="login-input">
                <IonLabel position="floating">Email</IonLabel>
                <IonInput ref={emailInputRef} type="email" />
              </IonItem>
              {emailError && <IonText color="danger"><p>{emailError}</p></IonText>}
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem className="login-input">
                <IonLabel position="floating">Hasło</IonLabel>
                <IonInput ref={passwordInputRef} type="password" />
              </IonItem>
              {passwordError && <IonText color="danger"><p>{passwordError}</p></IonText>}
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol className="ion-text-end">
              <IonText color="light">
                <small>Zapomniałeś hasła?</small>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonButton expand="block" className="login-button" onClick={handle_login}>
                ZALOGUJ
              </IonButton>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol className="ion-text-center">
              <IonText color="light">
                <small>
                  Nie masz konta?{" "}
                  <span
                    onClick={() => {handlePageChange("register")} }
                    className="register-link"
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    Zarejestruj się
                  </span>
                </small>
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>
        <div className="log-bottom-image">
          <img src="public/assets/login-dol.png" alt="Logowanie stopka" />
        </div>
      </IonContent>
    </IonApp>
  );
};

export default LoginForm;
