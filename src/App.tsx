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
  const SERVER = "http://localhost:8080";

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <IonApp>
      <IonPage>
        <IonContent>
          {currentPage === "Autentication" && (
            <Autentication SERVER={SERVER} handleMainPageChange={handlePageChange}/>
          )}
          {currentPage === "MainView" && <MainView />}
        </IonContent>
      </IonPage>

    </IonApp>
  );
};

export default App;
