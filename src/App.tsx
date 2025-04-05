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


import Autentication from "./components/autentication/Autentication";
import MainView from "./components/main_view/MainView";


setupIonicReact();

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("Autentication"); 
  const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";
  const SALT = import.meta.env.VITE_REACT_APP_SALT || "";

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
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

  async function sendEncryptedData(endpoint: string, data: Record<string, unknown>): Promise<any> {
    try {
      const encryptedPayload = await encryptData(data);
  
      const response = await fetch(`${SERVER}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encryptedPayload),
      });
  
      // Zakładając, że odpowiedź jest w formacie JSON
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Wystąpił błąd');
      }
  
      return response; // Zwróć wynik odpowiedzi
    } catch (error) {
      console.error('Błąd przy wysyłaniu danych:', error);
      throw error; // Rzucenie błędem, aby wywołujący mógł obsłużyć
    }
  }
  

  return (
    <IonApp>
      <IonPage>
        <IonContent>
          {currentPage === "Autentication" && (
            <Autentication SERVER={SERVER} handleMainPageChange={handlePageChange} sendEncryptedData={sendEncryptedData} />
          )}
          {currentPage === "MainView" && <MainView sendEncryptedData={sendEncryptedData} />}
        </IonContent>
      </IonPage>

    </IonApp>
  );
};

export default App;
