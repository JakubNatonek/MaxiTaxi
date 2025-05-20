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
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonModal,
  IonText,
} from "@ionic/react";
import "./AdminPanel.css";

interface User {
  id?: number;
  imie?: string;
  email: string;
  telefon?: string;
  typ_uzytkownika: string;
  data_utworzenia?: string;
}

interface AdminPanelProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  hashPassword: (password: string, salt: string) => Promise<string>;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const roles = ["admin", "kierowca", "pasazer"];

const emptyUser: User = {
  imie: "",
  email: "",
  telefon: "",
  typ_uzytkownika: "pasazer",
};

const AdminPanel: React.FC<AdminPanelProps> = ({
  sendEncryptedData,
  hashPassword,
  getEncryptedData,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [addUser, setAddUser] = useState<User>(emptyUser);
  const [addPassword, setAddPassword] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // NEW: Edit validation state
  const [editError, setEditError] = useState<string | null>(null);
  const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";
  // Pobieranie użytkowników z API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(SERVER + "/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Błąd podczas pobierania użytkowników");
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Błąd:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Wyszukiwanie użytkowników
  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(
          (u) =>
            (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
            (u.imie && u.imie.toLowerCase().includes(search.toLowerCase())) ||
            (u.telefon && u.telefon.includes(search))
        )
      );
    }
  }, [search, users]);

  // Edycja użytkownika
  const handleEdit = (user: User) => {
    setEditUser({ ...user });
    setShowEditModal(true);
  };

  const handleEditChange = (field: keyof User, value: string) => {
    setEditUser((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const validateEditForm = () => {
    if (!editUser?.email || !/\S+@\S+\.\S+/.test(editUser.email)) {
      setEditError("Proszę podać prawidłowy adres e-mail.");
      return false;
    }
    if (editUser?.telefon && !/^\d+$/.test(editUser.telefon)) {
      setEditError("Numer telefonu może zawierać tylko cyfry.");
      return false;
    }
    setEditError(null);
    return true;
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    if (!validateEditForm()) return;
    try {
      const token = localStorage.getItem("jwt");
      const body = JSON.stringify({
        imie: editUser.imie,
        telefon: editUser.telefon,
        typ_uzytkownika: editUser.typ_uzytkownika,
      });
      const response = await fetch(
        `http://localhost:8080/users/${encodeURIComponent(editUser.email)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );
      if (!response.ok) {
        const err = await response.json();
        setEditError(err.message || "Błąd podczas aktualizacji użytkownika");
        return;
      }
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setEditError("Błąd podczas aktualizacji użytkownika");
      console.error("Błąd:", err);
    }
  };

  // Usunięcie użytkownika
  const handleDelete = async () => {
    if (!editUser) return;
    if (!window.confirm("Czy na pewno chcesz usunąć tego użytkownika?")) return;
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch(
        `http://localhost:8080/users/${encodeURIComponent(editUser.email)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Błąd podczas usuwania użytkownika");
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      console.error("Błąd:", err);
    }
  };

  // Add user z hash + szyfrowanie
  const handleAddChange = (field: keyof User, value: string) => {
    setAddUser((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddForm = () => {
    if (!addUser.email || !/\S+@\S+\.\S+/.test(addUser.email)) {
      setAddError("Proszę podać prawidłowy adres e-mail.");
      return false;
    }
    if (!addPassword || addPassword.length < 6) {
      setAddError("Hasło musi mieć co najmniej 6 znaków.");
      return false;
    }
    if (addUser.telefon && !/^\d+$/.test(addUser.telefon)) {
      setAddError("Numer telefonu może zawierać tylko cyfry.");
      return false;
    }
    setAddError(null);
    return true;
  };

  const handleAddUser = async () => {
    if (!validateAddForm()) return;
    try {
      const token = localStorage.getItem("jwt");
      const salt = import.meta.env.VITE_REACT_APP_SALT || "";
      const hashedPassword = await hashPassword(addPassword, salt);
      const payload = {
        email: addUser.email,
        imie: addUser.imie,
        telefon: addUser.telefon,
        typ_uzytkownika: addUser.typ_uzytkownika,
        haslo: hashedPassword,
      };
      const response = await fetch("http://localhost:8080/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        setAddError(err.message || "Błąd podczas dodawania użytkownika");
        return;
      }
      setShowAddModal(false);
      setAddUser(emptyUser);
      setAddPassword("");
      setAddError(null);
      fetchUsers();
    } catch (err: any) {
      setAddError(err.message || "Błąd podczas dodawania użytkownika");
      console.error("Błąd:", err);
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
              <h2 className="admin-panel-title">
                Panel zarządzania użytkownikami
              </h2>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonInput
                placeholder="Wyszukaj użytkownika po e-mailu, imieniu lub telefonie"
                value={search}
                onIonChange={(e) => setSearch(e.detail.value!)}
                clearInput
              />
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <div className="table-container">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Imię</th>
                      <th>Telefon</th>
                      <th>Typ użytkownika</th>
                      <th>Akcja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr key={index}>
                        <td>{user.email}</td>
                        <td>{user.imie}</td>
                        <td>{user.telefon}</td>
                        <td>{user.typ_uzytkownika}</td>
                        <td>
                          <IonButton
                            size="small"
                            onClick={() => handleEdit(user)}
                          >
                            Edytuj
                          </IonButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" className="ion-text-center">
              <IonButton onClick={() => setShowAddModal(true)}>
                Dodaj nowego użytkownika
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Edit Modal */}
        <IonModal
          isOpen={showEditModal}
          onDidDismiss={() => setShowEditModal(false)}
        >
          <IonContent>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <h2>Edytuj użytkownika</h2>
                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput value={editUser?.email} disabled />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Imię</IonLabel>
                    <IonInput
                      value={editUser?.imie}
                      onIonInput={(e) =>
                        handleEditChange(
                          "imie",
                          (e.target as unknown as HTMLInputElement).value
                        )
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Telefon</IonLabel>
                    <IonInput
                      value={editUser?.telefon}
                      onIonInput={(e) =>
                        handleEditChange(
                          "telefon",
                          String((e.target as HTMLIonInputElement).value)
                        )
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Typ użytkownika</IonLabel>
                    <select
                      value={editUser?.typ_uzytkownika}
                      onChange={(e) =>
                        handleEditChange("typ_uzytkownika", e.target.value)
                      }
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </IonItem>
                  {editError && (
                    <IonText color="danger">
                      <p>{editError}</p>
                    </IonText>
                  )}
                  <IonRow>
                    <IonCol>
                      <IonButton expand="block" onClick={handleEditSave}>
                        Zapisz zmiany
                      </IonButton>
                    </IonCol>
                    <IonCol>
                      <IonButton
                        expand="block"
                        color="danger"
                        onClick={handleDelete}
                      >
                        Usuń użytkownika
                      </IonButton>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol>
                      <IonButton
                        expand="block"
                        fill="clear"
                        onClick={() => setShowEditModal(false)}
                      >
                        Anuluj
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>

        {/* Add Modal */}
        <IonModal
          isOpen={showAddModal}
          onDidDismiss={() => setShowAddModal(false)}
        >
          <IonContent>
            <IonGrid>
              <IonRow>
                <IonCol>
                  <h2>Dodaj nowego użytkownika</h2>
                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput
                      value={addUser.email}
                      onIonChange={(e) =>
                        handleAddChange("email", e.detail.value!)
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Imię</IonLabel>
                    <IonInput
                      value={addUser.imie}
                      onIonChange={(e) =>
                        handleAddChange("imie", e.detail.value!)
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Telefon</IonLabel>
                    <IonInput
                      value={addUser.telefon}
                      onIonChange={(e) =>
                        handleAddChange("telefon", e.detail.value!)
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Typ użytkownika</IonLabel>
                    <select
                      value={addUser.typ_uzytkownika}
                      onChange={(e) =>
                        handleAddChange("typ_uzytkownika", e.target.value)
                      }
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Hasło</IonLabel>
                    <IonInput
                      type="password"
                      value={addPassword}
                      onIonChange={(e) => setAddPassword(e.detail.value!)}
                    />
                  </IonItem>
                  {addError && (
                    <IonText color="danger">
                      <p>{addError}</p>
                    </IonText>
                  )}
                  <IonRow>
                    <IonCol>
                      <IonButton expand="block" onClick={handleAddUser}>
                        Dodaj użytkownika
                      </IonButton>
                    </IonCol>
                    <IonCol>
                      <IonButton
                        expand="block"
                        fill="clear"
                        onClick={() => setShowAddModal(false)}
                      >
                        Anuluj
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminPanel;