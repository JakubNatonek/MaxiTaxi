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
    

    return (
        <IonApp>
            {currentPage === "login" &&  <LoginForm SERVER={SERVER} onLoginStateChange={handleLoginStateChange} handlePageChange={handlePageChange}/>}
            {currentPage === "register" && <RegisterForm SERVER={SERVER} onLoginStateChange={handleLoginStateChange} handlePageChange={handlePageChange}/>}
        </IonApp>
    )
}


export default Autentication;