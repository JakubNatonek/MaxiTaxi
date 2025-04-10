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
import "./AdminPanel.css"; 

interface User {
  email: string;
  typ_uzytkownika: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const roles = ["admin", "kierowca", "pasazer"]; // Dostępne role

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

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(`http://localhost:8080/users/${selectedUser}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ typ_uzytkownika: selectedRole }),
      });

      if (!response.ok) {
        throw new Error("Błąd podczas aktualizacji typu użytkownika");
      }

      // Aktualizacja listy użytkowników po zmianie
      const updatedUsers = users.map((user) =>
        user.email === selectedUser ? { ...user, typ_uzytkownika: selectedRole } : user
      );
      setUsers(updatedUsers);

      // Resetowanie wyboru
      setSelectedUser(null);
      setSelectedRole("");
    } catch (error) {
      console.error("Błąd:", error);
    }
  };

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
      <IonCol size="12">
        <h2 className="admin-panel-title">Panel zarządzania użytkownikami</h2>
      </IonCol>
    </IonRow>
    <IonRow>
      <IonCol size="12">
        <div className="table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Typ użytkownika</th>
                <th>Akcja</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index}>
                  <td>{user.email}</td>
                  <td>
                    {selectedUser === user.email ? (
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="">Wybierz typ</option>
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      user.typ_uzytkownika
                    )}
                  </td>
                  <td>
                    {selectedUser === user.email ? (
                      <button onClick={handleRoleChange}>Zatwierdź</button>
                    ) : (
                      <button onClick={() => setSelectedUser(user.email)}>
                        Edytuj
                      </button>
                    )}
                  </td>
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