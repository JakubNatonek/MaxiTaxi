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
  IonPage,
  IonRow,
  IonSplitPane,
  IonText,
} from "@ionic/react";

import LoginForm from "../login_form/LoginForm";
import RegisterForm from "../register/RegisterForm";
import MapComponent from "../map/map";
import Payments from "../payments/Payments";
import Sidebar from "../side_bar/Sidebar";
// import MapComponent2 from "../map/map2";

interface MainViewProps {
  sendEncryptedData:  (endpoint: string, data: Record<string, unknown>) => Promise<any>;
}

const MainView: React.FC<MainViewProps> = ({sendEncryptedData }) => {
  const [currentPage, setCurrentPage] = useState("map"); 

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

    return (
        <IonApp>
            <IonSplitPane when="md" contentId="main">
                <Sidebar handlePageChange={handlePageChange} contentId="main"/>
                <IonPage id="main">
                    {currentPage === "map" && <MapComponent />}
                    {currentPage === "payments" && <Payments />}
                </IonPage>
            </IonSplitPane>
        </IonApp>
    )
}

export default MainView;