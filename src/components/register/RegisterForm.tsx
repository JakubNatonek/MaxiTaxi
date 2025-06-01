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

const SALT = import.meta.env.VITE_REACT_APP_SALT || ""; //DO USUNIĘCIA

interface RegisterFormProps {
  SERVER: string;
  onLoginStateChange: (isLogin: boolean) => void;
  handlePageChange: (page: string) => void;
  hashPassword: (password: string, salt: string) => Promise<string>;
  sendEncryptedData:  (endpoint: string, data: Record<string, unknown>) => Promise<any>;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ SERVER, onLoginStateChange, handlePageChange, hashPassword, sendEncryptedData}) => {
  const emailInputRef = useRef<HTMLIonInputElement>(null);
  const passwordInputRef = useRef<HTMLIonInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLIonInputElement>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null >(null);


  const handle_register = async () => {
    if (validateForm()) {
      const email = String(emailInputRef.current?.value ?? "").trim();
      const password = await hashPassword(String(passwordInputRef.current?.value ?? "").trim(), SALT);
      const response = await sendEncryptedData("register", { user: email, password });
      if(response.ok) {
        // wykonano pomyślnie
        onLoginStateChange(true);
      }
    }
  };

  const goToLogin = () => {
    handlePageChange("login");
  };

  const validateForm = () => {
    const email = String(emailInputRef.current!.value).trim();
    const password = String(passwordInputRef.current!.value).trim();
    const confirmPassword = String(confirmPasswordInputRef.current!.value).trim();

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

    if (!confirmPassword || confirmPassword !== password) {
      setConfirmPasswordError("Hasła nie są takie same.");
      isValid = false;
    } else {
      setConfirmPasswordError(null);
    }

    return isValid;
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
                <IonInput ref={emailInputRef} type="email" />
              </IonItem>
              {emailError && <IonText color="danger"><p>{emailError}</p></IonText>}
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem className="register-input">
                <IonLabel position="floating">Hasło</IonLabel>
                <IonInput ref={passwordInputRef} type="password" />
              </IonItem>
              {passwordError && <IonText color="danger"><p>{passwordError}</p></IonText>}
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem className="register-input">
                <IonLabel position="floating">Potwierdź hasło</IonLabel>
                <IonInput ref={confirmPasswordInputRef} type="password" />
              </IonItem>
              {confirmPasswordError && <IonText color="danger"><p>{confirmPasswordError}</p></IonText>}
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonButton expand="block" className="register-button" onClick={handle_register}>
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
        <img src="/assets/login-dol.png" alt="Rejestracja stopka" />
        </div>
      </IonContent>
    </IonApp>
  );
};

export default RegisterForm;