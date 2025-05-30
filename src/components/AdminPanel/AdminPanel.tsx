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
  rola_id: number; // id roli z rola_as_uzytkownik
  rola_nazwa?: string; // nazwa roli z tabela role
  data_utworzenia?: string;
}

interface Role {
  id: number;
  nazwa: string;
}

interface AdminPanelProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>,
    method?: string // Dodanie opcjonalnego parametru dla metody HTTP
  ) => Promise<any>;
  hashPassword: (password: string, salt: string) => Promise<string>;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const emptyUser: User = {
  imie: "",
  email: "",
  telefon: "",
  rola_id: 2, // domyślnie pasażer
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

  
  const [editError, setEditError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";

  // Pobieranie ról z bazy
  const fetchRoles = async () => {
    try {
      const data = await getEncryptedData("roles");
      setRoles(data);
    } catch (error) {
      console.error("Błąd podczas pobierania ról:", error);
    }
  };

  // Pobieranie użytkowników z API (z nazwą roli)
  const fetchUsers = async () => {
    try {
      const data = await getEncryptedData("users");
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Błąd podczas pobierania użytkowników:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
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
    setEditUser({ ...user, rola_id: user.rola_id });
    setShowEditModal(true);
  };

  const handleEditChange = (field: keyof User, value: string | number) => {
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

  // ZAPISZ EDYCJĘ użytkownika (w tym zmianę roli)
  const handleEditSave = async () => {
    if (!editUser) return;
    if (!validateEditForm()) return;
    try {
      // Aktualizuj dane użytkownika
      const userData = {
        imie: editUser.imie,
        telefon: editUser.telefon,
      };
      
      await sendEncryptedData(
        `users/${encodeURIComponent(editUser.email)}`, 
        userData, 
        "PUT"  // Dodaj metodę PUT
      );
      
      // Aktualizuj rolę użytkownika
      const roleData = {
        rola_id: editUser.rola_id
      };
      
      await sendEncryptedData(
        `users/${encodeURIComponent(editUser.email)}/role`, 
        roleData, 
        "PUT"  // Dodaj metodę PUT
      );
      
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
    if (!window.confirm("Czy na pewno chcesz zamknąć konto tego użytkownika?")) return;
    try {
      // Zamiast usuwać, zmieniamy rolę użytkownika na 4 (zamknięte)
      const roleData = {
        rola_id: 4  // Zamknięte konto
      };
      
      // Dodaj trzeci parametr "PUT", ponieważ endpoint oczekuje metody PUT
      await sendEncryptedData(`users/${encodeURIComponent(editUser.email)}/role`, roleData, "PUT");
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      console.error("Błąd podczas zamykania konta użytkownika:", err);
    }
  };

  // Add user z hash + szyfrowanie
  const handleAddChange = (field: keyof User, value: string | number) => {
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

  // Dodawanie użytkownika z wybraną rolą
  const handleAddUser = async () => {
    if (!validateAddForm()) return;
    try {
      const salt = import.meta.env.VITE_REACT_APP_SALT || "";
      const hashedPassword = await hashPassword(addPassword, salt);
      
      const userData = {
        email: addUser.email,
        imie: addUser.imie,
        telefon: addUser.telefon,
        haslo: hashedPassword,
        rola_id: addUser.rola_id,
      };
      
      await sendEncryptedData("users", userData);
      
      setShowAddModal(false);
      setAddUser(emptyUser);
      setAddPassword("");
      setAddError(null);
      fetchUsers();
    } catch (err) {
      setAddError("Błąd podczas dodawania użytkownika");
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
                onIonInput={(e) => setSearch(e.detail.value!)}
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
                        <td>{user.rola_nazwa}</td>
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
                      value={editUser?.rola_id ?? ""}
                      onChange={(e) =>
                        handleEditChange("rola_id", Number(e.target.value))
                      }
                    >
                      <option value="" disabled>Wybierz rolę</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.nazwa}
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
                        Zamknij konto użytkownika
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
                      onIonInput={(e) =>
                        handleAddChange("email", e.detail.value!)
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Imię</IonLabel>
                    <IonInput
                      value={addUser.imie}
                      onIonInput={(e) =>
                        handleAddChange("imie", e.detail.value!)
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Telefon</IonLabel>
                    <IonInput
                      value={addUser.telefon}
                      onIonInput={(e) =>
                        handleAddChange("telefon", e.detail.value!)
                      }
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Typ użytkownika</IonLabel>
                    <select
                      value={addUser.rola_id}
                      onChange={(e) =>
                        handleAddChange("rola_id", Number(e.target.value))
                      }
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.nazwa}
                        </option>
                      ))}
                    </select>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Hasło</IonLabel>
                    <IonInput
                      type="password"
                      value={addPassword}
                      onIonInput={(e) => setAddPassword(e.detail.value!)}
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