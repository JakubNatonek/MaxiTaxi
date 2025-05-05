import React, { useState, useEffect } from "react";
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

import LoginForm from "../login_form/LoginForm";
import RegisterForm from "../register/RegisterForm";

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";
const SALT = import.meta.env.VITE_REACT_APP_SALT || "";

interface AutenticationProps {
  SERVER: string;
  handleMainPageChange: (page: string) => void;
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
<<<<<<< HEAD
  getEncryptedData: (
    endpoint: string
  ) => Promise<any>;
=======
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
}

const Autentication: React.FC<AutenticationProps> = ({
  SERVER,
  handleMainPageChange,
  sendEncryptedData,
<<<<<<< HEAD
  getEncryptedData,
=======
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("login");

  useEffect(() => {
    const token = localStorage.getItem("jwt");

    if (token) {
      const tokenPayload = JSON.parse(atob(token.split(".")[1])); // Dekodowanie payloadu JWT
      const tokenExpiration = tokenPayload.exp * 1000; // Czas wygaśnięcia w ms
      const currentTime = Date.now();

      if (currentTime >= tokenExpiration) {
        // Token wygasł
        handleLogout();
      } else {
        setIsLoggedIn(true);
        handleMainPageChange("MainView");

        // Ustaw timer na automatyczne wylogowanie
        const timeout = tokenExpiration - currentTime;

        // Wypisywanie czasu do wylogowania co sekundę
        const interval = setInterval(() => {
<<<<<<< HEAD
          const remainingTime = Math.max(
            0,
            Math.floor((tokenExpiration - Date.now()) / 1000)
          );
=======
          const remainingTime = Math.max(0, Math.floor((tokenExpiration - Date.now()) / 1000));
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
          console.log(`Pozostało ${remainingTime} sekund do wylogowania.`);
          if (remainingTime <= 0) {
            clearInterval(interval);
          }
        }, 1000);

        const logoutTimer = setTimeout(() => {
          handleLogout();
          clearInterval(interval); // Zatrzymanie interwału po wylogowaniu
        }, timeout);

        return () => {
          clearTimeout(logoutTimer);
          clearInterval(interval);
        };
      }
    }
  }, [handleMainPageChange]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setIsLoggedIn(false);
    setCurrentPage("login");
  };

  const handleLoginStateChange = async (loggedIn: boolean) => {
    await setIsLoggedIn(loggedIn);
    if (loggedIn) {
      await handleMainPageChange("MainView");
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const hashPassword = async (password: string, salt: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  };

  return (
    <IonApp>
      {currentPage === "login" && (
        <LoginForm
          SERVER={SERVER}
          onLoginStateChange={handleLoginStateChange}
          handlePageChange={handlePageChange}
          hashPassword={hashPassword}
          sendEncryptedData={sendEncryptedData}
        />
      )}
      {currentPage === "register" && (
        <RegisterForm
          SERVER={SERVER}
          onLoginStateChange={handleLoginStateChange}
          handlePageChange={handlePageChange}
          hashPassword={hashPassword}
          sendEncryptedData={sendEncryptedData}
        />
      )}
    </IonApp>
  );
};

export default Autentication;