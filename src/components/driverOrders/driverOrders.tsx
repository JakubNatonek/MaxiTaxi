import React from 'react';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle } from '@ionic/react';

const DriverOrders: React.FC = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <IonHeader>
        <IonToolbar color="custom-grey">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="toolbar-logo-title">
            <img src="public/assets/menu_logo.png" alt="MaxiTaxi Logo" />
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1>Zlecenia</h1>
      </div>
    </div>
  );
};

export default DriverOrders;