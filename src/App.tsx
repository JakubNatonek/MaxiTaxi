import React, { useState, useEffect } from "react";
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
import { jwtDecode } from "jwt-decode";

declare module "jwt-decode" {
  export default function jwtDecode<T>(token: string): T;
}

import { JwtPayload } from "./JwtPayLoad";
setupIonicReact();

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("Autentication"); 
  const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";
  const SALT = import.meta.env.VITE_REACT_APP_SALT || "";
  const KEY = import.meta.env.VITE_REACT_APP_SECRET_KEY || "";
  
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  // Funkcja do wylogowywania
  const logout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("roleId");
    setCurrentPage("Autentication");
  };
  
  // Sprawdź czy token jest ważny
  const isTokenValid = () => {
    const token = localStorage.getItem("jwt");
    if (!token) return false;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000; // Konwersja na sekundy
      return decoded.exp > currentTime;
    } catch (e) {
      return false;
    }
  };
  
  // Funkcja do odświeżenia tokenu
  const refreshToken = async () => {
    try {
      const currentToken = localStorage.getItem("jwt");
      if (!currentToken) return;
      
      console.log(`[${new Date().toLocaleTimeString()}] Próba odświeżenia tokenu...`);
      
      const response = await fetch(`${SERVER}/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem("jwt", data.token);
          
          // Aktualizuj roleId z nowego tokenu
          const decoded = jwtDecode<JwtPayload>(data.token);
          localStorage.setItem("roleId", String(decoded.roleId));
          
          //console.log(`[${new Date().toLocaleTimeString()}] Token został odświeżony, wygaśnie za ${Math.round((decoded.exp*1000 - Date.now())/60000)} minut`);
        }
      } else {
        // Jeśli nie udało się odświeżyć tokenu, wyloguj
        //console.log(`[${new Date().toLocaleTimeString()}] Nie udało się odświeżyć tokenu - status ${response.status}`);
        logout();
      }
    } catch (error) {
      //console.error(`[${new Date().toLocaleTimeString()}] Błąd podczas odświeżania tokenu:`, error);
      logout();
    }
  };

  // Sprawdza co 5 minut czy token jest ważny i odświeża go jeśli potrzeba
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("jwt");
      if (!token) return;
      
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const expirationTime = decoded.exp; // sekundy
        const currentTime = Date.now() / 1000; // konwersja na sekundy
        
        // Jeśli token wygasł - wyloguj
        if (currentTime >= expirationTime) {
          //console.log("Token wygasł. Wylogowanie...");
          logout();
        } 
        // Jeśli zostało mniej niż 10 minut - odśwież
        else if (expirationTime - currentTime < 10 * 60) {
          //console.log("Token wkrótce wygaśnie. Odświeżanie...");
          refreshToken();
        }
      } catch (e) {
        //console.error("Błąd podczas sprawdzania tokenu:", e);
        logout();
      }
    }, 5 * 60 * 1000); // sprawdzaj co 5 minut
    
    return () => clearInterval(interval);
  }, []);
  
  // Nasłuchuj aktywności użytkownika
  useEffect(() => {
    const handleActivity = () => {
      const token = localStorage.getItem("jwt");
      if (!token) return;
      
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const expirationTime = decoded.exp; // sekundy
        const currentTime = Date.now() / 1000; // konwersja na sekundy
        
        // Jeśli zostało mniej niż 10 minut - odśwież
        if (expirationTime - currentTime < 10 * 60) {
          refreshToken();
        }
      } catch (e) {
        console.error("Błąd podczas sprawdzania tokenu:", e);
        logout();
      }
    };
    
    // Dodaj nasłuchiwanie na wydarzenia interakcji z debounce
    let timeout: number | null = null;
    const debouncedActivity = () => {
      if (timeout) clearTimeout(timeout);
      timeout = window.setTimeout(handleActivity, 2000);
    };
    
    window.addEventListener('click', debouncedActivity);
    window.addEventListener('touchstart', debouncedActivity);
    window.addEventListener('keypress', debouncedActivity);
    window.addEventListener('scroll', debouncedActivity);
    
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener('click', debouncedActivity);
      window.removeEventListener('touchstart', debouncedActivity);
      window.removeEventListener('keypress', debouncedActivity);
      window.removeEventListener('scroll', debouncedActivity);
    };
  }, []);
  
  // Sprawdza token przy starcie aplikacji
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      if (isTokenValid()) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          localStorage.setItem("roleId", String(decoded.roleId));
          setCurrentPage("MainView"); // Automatycznie przejdź do widoku głównego
        } catch (e) {
          localStorage.removeItem("roleId");
          logout();
        }
      } else {
        // Token wygasł, wyloguj
        logout();
      }
    }
  }, []);

  async function generateKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(KEY), // 16 bajtów
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

  const sendEncryptedData = async (endpoint: string, data: Record<string, unknown>, method: string = "POST") => {
    try {
      // Sprawdź, czy token jest ważny przed wysłaniem żądania
      if (!isTokenValid() && endpoint !== "login" && endpoint !== "register") {
        logout();
        throw new Error("Token wygasł. Wylogowano.");
      }
      
      const payload = { ...data };
      const encrypted = await encryptData(payload);
      const token = localStorage.getItem("jwt");
      
      const response = await fetch(`${SERVER}/${endpoint}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(encrypted)
      });
      
      // Pobierz Content-Type przed odczytaniem ciała odpowiedzi
      const contentType = response.headers.get("content-type");
      
      // Sprawdź czy wystąpił błąd autoryzacji (401)
      if (response.status === 401) {
        logout();
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      }
      
      if (!response.ok) {
        let errorMessage;
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || `Błąd ${response.status}`;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || `Błąd HTTP: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Obsługa odpowiedzi sukcesu
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error: any) {
      console.error("Błąd przy wysyłaniu danych:", error);
      throw error;
    }
  };

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
      // Sprawdź, czy token jest ważny przed wysłaniem żądania
      if (!isTokenValid() && endpoint !== "login" && endpoint !== "register") {
        logout();
        throw new Error("Token wygasł. Wylogowano.");
      }
      
      const token = localStorage.getItem("jwt");
      const response = await fetch(`${SERVER}/${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      
      // Sprawdź czy wystąpił błąd autoryzacji (401)
      if (response.status === 401) {
        logout();
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      }
  
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

  return (
    <IonApp>
      <IonPage>
        <IonContent>
          {currentPage === "Autentication" && (
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
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default App;
