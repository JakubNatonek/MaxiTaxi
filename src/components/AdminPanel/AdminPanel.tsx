import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonRow,
  IonCol,
  IonGrid,
} from "@ionic/react";
import "./AdminPanel.css"; // Import stylów

interface User {
  email: string;
  typ_uzytkownika: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("jwt");
        const response = await fetch("http://localhost:8080/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Błąd podczas pobierania użytkowników");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Błąd:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <IonPage>
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
      <IonContent>
        <IonGrid>
          <IonRow>
            <IonCol>
              <h2 className="admin-panel-title">Lista użytkowników</h2>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <div className="table-container">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Typ użytkownika</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={index}>
                        <td>{user.email}</td>
                        <td>{user.typ_uzytkownika}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AdminPanel;