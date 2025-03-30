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

interface AutenticationProps {
    SERVER: string;
    handleMainPageChange: (page: string) => void;
}

const Autentication: React.FC<AutenticationProps> = ({ SERVER, handleMainPageChange}) => {
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
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
        return hashHex;
    };

    return (
        <IonApp>
            {currentPage === "login" &&  <LoginForm SERVER={SERVER} onLoginStateChange={handleLoginStateChange} handlePageChange={handlePageChange} hashPassword={hashPassword}/>}
            {currentPage === "register" && <RegisterForm SERVER={SERVER} onLoginStateChange={handleLoginStateChange} handlePageChange={handlePageChange} hashPassword={hashPassword}/>}
        </IonApp>
    )
}


export default Autentication;