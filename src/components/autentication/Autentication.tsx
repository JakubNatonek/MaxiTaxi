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

import LoginForm from "../login_form/LoginForm";
import RegisterForm from "../register/RegisterForm";

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";
const SALT = import.meta.env.VITE_REACT_APP_SALT || "";

// console.log("SERVER:", import.meta.env.VITE_REACT_APP_API_URL);
// console.log("SALT:", import.meta.env.VITE_REACT_APP_SALT);

interface AutenticationProps {
  SERVER: string;
  handleMainPageChange: (page: string) => void;
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
}

const Autentication: React.FC<AutenticationProps> = ({
  SERVER,
  handleMainPageChange,
  sendEncryptedData,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("login");

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
