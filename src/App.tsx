import React, { useState } from "react";
import {
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";


import "./theme/variables.css";
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/palettes/dark.system.css";

<<<<<<< HEAD

=======
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
import Autentication from "./components/autentication/Autentication";
import MainView from "./components/main_view/MainView";
import { jwtDecode } from "jwt-decode";

declare module "jwt-decode" {
  export default function jwtDecode<T>(token: string): T;
}

interface JwtPayload {
<<<<<<< HEAD
  id: number        // id
=======
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
  userType: string; // Rola użytkownika
  email: string;    // Adres e-mail użytkownika
  exp: number;      // Czas wygaśnięcia tokena (opcjonalnie)
}

setupIonicReact();

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("Autentication"); 
  const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";
  const SALT = import.meta.env.VITE_REACT_APP_SALT || "";
<<<<<<< HEAD
  const KEY = import.meta.env.VITE_REACT_APP_SECRET_KEY || "";
=======
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const token = localStorage.getItem("jwt");
  let userRole = null; // Inicjalizuj zmienną roli użytkownika jako null
  if (token) {
    const decoded = jwtDecode<JwtPayload>(token); // Użyj własnego typu JwtPayload
    const userRole = decoded.userType; // Pobierz rolę użytkownika
    localStorage.setItem("role", userRole); // Zapisz rolę w localStorage
  }
  
<<<<<<< HEAD

  async function generateKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(KEY), // 16 bajtów
=======
  
  async function generateKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      
      new TextEncoder().encode(import.meta.env.VITE_REACT_APP_SECRET_KEY), // 16 bajtów
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
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

  async function sendEncryptedData(endpoint: string, data: Record<string, unknown>): Promise<any> {
    try {
      const encryptedPayload = await encryptData(data);
      const token = localStorage.getItem("jwt"); // Pobierz token z localStorage
  
      const response = await fetch(`${SERVER}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "", 
        },
        body: JSON.stringify(encryptedPayload),
      });
  
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || "Wystąpił błąd");
      }
  
      const result = await response.json();
      return result; 
<<<<<<< HEAD
    } catch (error: any) {
=======
    } catch (error) {
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
      console.error("Błąd przy wysyłaniu danych:", error);
      throw error; 
    }
  }
<<<<<<< HEAD

  async function decryptData(iv: number[], encryptedData: number[]): Promise<any> {
    const ivBuffer = new Uint8Array(iv);
    const encryptedBuffer = new Uint8Array(encryptedData);
    const key = await generateKey();
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: ivBuffer
      },
      key,
      encryptedBuffer
    );
  
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decrypted);
    return JSON.parse(decryptedText);
  }

  async function getEncryptedData(endpoint: string): Promise<any> {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(`${SERVER}/${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
  
      if (!response.ok) {
        let errJson = null;
        try { errJson = await response.json(); } catch {}
        throw new Error(errJson?.message || `Błąd ${response.status}`);
      }
  
      const payload = await response.json();
      
      if (
        payload &&
        Array.isArray(payload.iv) &&
        Array.isArray(payload.data)
      ) {
        return await decryptData(payload.iv, payload.data);
      }
  
      return payload;
    } catch (err) {
      console.error("Błąd przy pobieraniu danych:", err);
      throw err;
    }
  }
=======
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
  

  return (
    <IonApp>
      <IonPage>
        <IonContent>
          {currentPage === "Autentication" && (
<<<<<<< HEAD
            <Autentication 
              SERVER={SERVER} 
              handleMainPageChange={handlePageChange} 
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
            />
          )}
          {currentPage === "MainView" && 
            <MainView 
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
          />}
=======
            <Autentication SERVER={SERVER} handleMainPageChange={handlePageChange} sendEncryptedData={sendEncryptedData} />
          )}
          {currentPage === "MainView" && <MainView sendEncryptedData={sendEncryptedData}/>}
>>>>>>> d3fea683916dbe31c7eca7359516308b5ea561ed
        </IonContent>
      </IonPage>

    </IonApp>
  );
};

export default App;
