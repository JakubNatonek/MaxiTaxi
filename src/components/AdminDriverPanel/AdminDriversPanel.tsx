import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonSearchbar,
  IonAlert,
  IonText,
  IonIcon,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import './AdminDriversPanel.css';

interface Driver {
  uzytkownik_id: number;
  imie?: string;
  email?: string;
  numer_prawa_jazdy?: string;
  model_pojazdu?: string;
  nr_rejestracyjny?: string;
  kolor_pojazdu?: string;
  ocena: number;
  telefon?: string;
  data_utworzenia?: string;
  ostatnia_lokalizacja?: {
    szerokosc_geo: number;
    dlugosc_geo: number;
    zaktualizowano: string;
  };
  liczba_ocen?: number;
}

interface User {
  id: number;
  imie?: string;
  email: string;
}

interface AdminDriversPanelProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>,
    method?: string
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const AdminDriversPanel: React.FC<AdminDriversPanelProps> = ({
  sendEncryptedData,
  getEncryptedData,
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [editedDriver, setEditedDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({});
  const [search, setSearch] = useState('');
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriverReviews, setSelectedDriverReviews] = useState<any[]>([]);
  
  // Dodaj stan dla potwierdzenia usunięcia recenzji
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  
  // Pobieranie danych o kierowcach
  const fetchDrivers = async (silentRefresh = false) => {
    if (!silentRefresh) {
      setIsLoading(true);
    }
    try {
      const data = await getEncryptedData('admin/drivers');
      setDrivers(data);
      setFilteredDrivers(data);
    } catch (error: any) {
      console.error('Błąd podczas pobierania danych kierowców:', error);
    } finally {
      if (!silentRefresh) {
        setIsLoading(false);
      }
    }
  };
  
  // Pobieranie kwalifikujących się użytkowników (z rolą kierowcy, ale bez rekordu w tabeli kierowcy)
  const fetchEligibleUsers = async () => {
    try {
      const data = await getEncryptedData('admin/eligible-drivers');
      setAvailableUsers(data);
    } catch (error: any) {
      console.error('Błąd podczas pobierania kwalifikujących się użytkowników:', error);
    }
  };
  
  // Pobieranie recenzji kierowcy
  const fetchDriverReviews = async (driverId: number) => {
    try {
      const data = await getEncryptedData(`admin/drivers/${driverId}/reviews`);
      setSelectedDriverReviews(data);
    } catch (error: any) {
      console.error('Błąd podczas pobierania recenzji kierowcy:', error);
    }
  };

  // Początkowe ładowanie danych
  useEffect(() => {
    fetchDrivers();
    fetchEligibleUsers();
  }, []);
  
  // Automatyczne odświeżanie danych
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDrivers(true); // true = ciche odświeżanie bez wskaźnika ładowania
    }, 5000);
    
    // Czyszczenie interwału przy odmontowaniu komponentu
    return () => clearInterval(interval);
  }, []);
  
  // Filtrowanie kierowców na podstawie wyszukiwania
  useEffect(() => {
    if (!search) {
      setFilteredDrivers(drivers);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredDrivers(
        drivers.filter(
          driver =>
            (driver.imie && driver.imie.toLowerCase().includes(searchLower)) ||
            (driver.email && driver.email.toLowerCase().includes(searchLower)) ||
            (driver.model_pojazdu && driver.model_pojazdu.toLowerCase().includes(searchLower)) ||
            (driver.nr_rejestracyjny && driver.nr_rejestracyjny.toLowerCase().includes(searchLower))
        )
      );
    }
  }, [search, drivers]);

  // Obsługa podglądu szczegółów kierowcy
  const handleViewDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setEditedDriver({ ...driver });
    setShowDriverModal(true);
  };
  
  // Obsługa podglądu recenzji kierowcy
  const handleViewDriverReviews = (driver: Driver) => {
    setSelectedDriver(driver);
    fetchDriverReviews(driver.uzytkownik_id);
    setShowDetailsModal(true);
  };

  // Obsługa dodawania nowego kierowcy
  const handleAddDriver = async () => {
    if (!newDriver.uzytkownik_id) {
      setEditError('Musisz wybrać użytkownika');
      return;
    }
    
    try {
      setBusy(true);
      await sendEncryptedData('admin/drivers', {
        ...newDriver
      }, 'POST');
      
      setShowAddModal(false);
      setNewDriver({});
      fetchDrivers();
      fetchEligibleUsers();
      setEditError(null);
    } catch (error: any) {
      console.error('Błąd podczas dodawania kierowcy:', error);
      setEditError(error.message || 'Błąd podczas dodawania kierowcy');
    } finally {
      setBusy(false);
    }
  };

  // Obsługa zapisywania edycji kierowcy
  const handleSaveDriver = async () => {
    if (!editedDriver) return;
    
    try {
      setBusy(true);
      await sendEncryptedData(`admin/drivers/${editedDriver.uzytkownik_id}`, {
        numer_prawa_jazdy: editedDriver.numer_prawa_jazdy || null,
        model_pojazdu: editedDriver.model_pojazdu || null,
        nr_rejestracyjny: editedDriver.nr_rejestracyjny || null,
        kolor_pojazdu: editedDriver.kolor_pojazdu || null
      }, 'PUT');
      
      setShowDriverModal(false);
      fetchDrivers();
      setEditError(null);
    } catch (error: any) {
      console.error('Błąd podczas aktualizacji danych kierowcy:', error);
      setEditError(error.message || 'Błąd podczas aktualizowania danych kierowcy');
    } finally {
      setBusy(false);
    }
  };

  // Obsługa usuwania kierowcy
  const handleDeleteDriver = async () => {
    if (!selectedDriver) return;
    
    try {
      setBusy(true);
      await sendEncryptedData(`admin/drivers/${selectedDriver.uzytkownik_id}`, {}, 'DELETE');
      
      setShowDeleteModal(false);
      setShowDriverModal(false);
      fetchDrivers();
      fetchEligibleUsers();
    } catch (error: any) {
      setEditError(error.message || 'Błąd podczas usuwania kierowcy');
    } finally {
      setBusy(false);
    }
  };
  
  // Obsługa usuwania recenzji
  const handleDeleteReview = async (reviewId: number) => {
    if (!selectedDriver) return;
    
    try {
      setBusy(true);
      await sendEncryptedData(`admin/reviews/${reviewId}`, {}, 'DELETE');
      
      // Odśwież listę recenzji po usunięciu
      fetchDriverReviews(selectedDriver.uzytkownik_id);
      // Odśwież dane kierowcy, aby zaktualizować średnią ocenę
      fetchDrivers(true);
      
      // Wyświetl komunikat o powodzeniu
      setEditError(null);
    } catch (error: any) {
      console.error('Błąd podczas usuwania recenzji:', error);
      setEditError(error.message || 'Błąd podczas usuwania recenzji');
    } finally {
      setBusy(false);
    }
  };

  // Dodaj funkcję do obsługi konfirmacji usuwania recenzji
  const confirmDeleteReview = (reviewId: number) => {
    setReviewToDelete(reviewId);
    setShowDeleteReviewConfirm(true);
  };

  const executeDeleteReview = () => {
    if (reviewToDelete !== null) {
      handleDeleteReview(reviewToDelete);
      setShowDeleteReviewConfirm(false);
      setReviewToDelete(null);
    }
  };
  
  // Obsługa zmian formularza dla edycji
  const handleEditChange = (field: keyof Driver, value: any) => {
    if (!editedDriver) return;
    setEditedDriver({
      ...editedDriver,
      [field]: value
    });
  };
  
  // Obsługa zmian formularza dla nowego kierowcy
  const handleNewDriverChange = (field: keyof Driver, value: any) => {
    setNewDriver({
      ...newDriver,
      [field]: value
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="custom-grey">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="toolbar-logo-title">
            <img src="/assets/menu_logo.png" alt="MaxiTaxi Logo" />
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid className="ion-padding">
          <IonRow>
            <IonCol>
              <h1>Panel Zarządzania Kierowcami</h1>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="12" size-md="8">
              <IonSearchbar
                value={search}
                onIonInput={e => setSearch(e.detail.value || '')}
                placeholder="Szukaj kierowcy..."
                className="custom-searchbar"
              />
            </IonCol>
            <IonCol size="12" size-md="4" className="ion-text-end">
              <IonButton onClick={() => setShowAddModal(true)}>
                Dodaj Kierowcę
              </IonButton>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="12">
              {isLoading ? (
                <div className="loading-container">
                  <IonSpinner />
                  <p>Ładowanie danych kierowców...</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Imię</th>
                        <th>Email</th>
                        <th>Pojazd</th>
                        <th>Nr rejestracyjny</th>
                        <th>Ocena</th>
                        <th>Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrivers.map((driver) => (
                        <tr key={driver.uzytkownik_id}>
                          <td>{driver.uzytkownik_id}</td>
                          <td>{driver.imie || 'Brak'}</td>
                          <td>{driver.email}</td>
                          <td>{driver.model_pojazdu || 'Nie podano'}</td>
                          <td>{driver.nr_rejestracyjny || 'Nie podano'}</td>
                          <td>
                            {typeof driver.ocena === 'number' 
                              ? driver.ocena.toFixed(2) 
                              : (parseFloat(driver.ocena || '5.00')).toFixed(2)} ({driver.liczba_ocen || 0})
                          </td>
                          <td>
                            <IonButton
                              size="small"
                              onClick={() => handleViewDriver(driver)}
                            >
                              Edytuj
                            </IonButton>
                            <IonButton
                              size="small"
                              color="tertiary"
                              onClick={() => handleViewDriverReviews(driver)}
                            >
                              Recenzje
                            </IonButton>
                          </td>
                        </tr>
                      ))}
                      {filteredDrivers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="ion-text-center">
                            Brak kierowców do wyświetlenia
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </IonCol>
          </IonRow>
        </IonGrid>
        
        {/* Modal edycji kierowcy */}
        <IonModal isOpen={showDriverModal} onDidDismiss={() => setShowDriverModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Szczegóły Kierowcy</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDriverModal(false)}>
                  Zamknij
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {editedDriver && (
              <IonGrid>
                {editError && (
                  <IonRow>
                    <IonCol>
                      <IonText color="danger">{editError}</IonText>
                    </IonCol>
                  </IonRow>
                )}
                
                {/* Pola nieedytowalne */}
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">ID Użytkownika</IonLabel>
                      <IonInput value={editedDriver.uzytkownik_id} disabled />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Email</IonLabel>
                      <IonInput value={editedDriver.email} disabled />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Imię</IonLabel>
                      <IonInput value={editedDriver.imie || 'Nie podano'} disabled />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Telefon</IonLabel>
                      <IonInput value={editedDriver.telefon || 'Nie podano'} disabled />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Średnia Ocen</IonLabel>
                      <IonInput 
                        value={`${typeof editedDriver.ocena === 'number' 
                          ? editedDriver.ocena.toFixed(2) 
                          : (parseFloat(editedDriver.ocena || '5.00')).toFixed(2)} (${editedDriver.liczba_ocen || 0} ocen)`} 
                        disabled 
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Data utworzenia konta</IonLabel>
                      <IonInput value={editedDriver.data_utworzenia ? new Date(editedDriver.data_utworzenia).toLocaleString() : 'Nie znana'} disabled />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                {/* Pola edytowalne */}
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Numer prawa jazdy</IonLabel>
                      <IonInput 
                        value={editedDriver.numer_prawa_jazdy || ''} 
                        onIonInput={(e) => handleEditChange('numer_prawa_jazdy', e.detail.value)}
                        placeholder="Wprowadź numer prawa jazdy"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Model pojazdu</IonLabel>
                      <IonInput 
                        value={editedDriver.model_pojazdu || ''} 
                        onIonInput={(e) => handleEditChange('model_pojazdu', e.detail.value)}
                        placeholder="Wprowadź model pojazdu"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Numer rejestracyjny</IonLabel>
                      <IonInput 
                        value={editedDriver.nr_rejestracyjny || ''} 
                        onIonInput={(e) => handleEditChange('nr_rejestracyjny', e.detail.value)}
                        placeholder="Wprowadź numer rejestracyjny"
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Kolor pojazdu</IonLabel>
                      <IonInput 
                        value={editedDriver.kolor_pojazdu || ''} 
                        onIonInput={(e) => handleEditChange('kolor_pojazdu', e.detail.value)}
                        placeholder="Wprowadź kolor pojazdu"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                {/* Dane lokalizacyjne (jeśli dostępne) */}
                {editedDriver.ostatnia_lokalizacja && (
                  <IonRow>
                    <IonCol size="12">
                      <h4>Ostatnia znana lokalizacja:</h4>
                      <p>
                        Szerokość: {editedDriver.ostatnia_lokalizacja.szerokosc_geo}<br/>
                        Długość: {editedDriver.ostatnia_lokalizacja.dlugosc_geo}<br/>
                        Zaktualizowano: {new Date(editedDriver.ostatnia_lokalizacja.zaktualizowano).toLocaleString()}
                      </p>
                    </IonCol>
                  </IonRow>
                )}
                
                {/* Przyciski akcji */}
                <IonRow className="ion-margin-top">
                  <IonCol>
                    <IonButton expand="block" onClick={handleSaveDriver} disabled={busy}>
                      {busy ? <IonSpinner name="crescent" /> : 'Zapisz zmiany'}
                    </IonButton>
                  </IonCol>
                  <IonCol>
                    <IonButton expand="block" color="danger" onClick={() => setShowDeleteModal(true)} disabled={busy}>
                      Usuń kierowcę
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            )}
          </IonContent>
        </IonModal>
        
        {/* Modal dodawania kierowcy */}
        <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Dodaj Nowego Kierowcę</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAddModal(false)}>
                  Zamknij
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonGrid>
              {editError && (
                <IonRow>
                  <IonCol>
                    <IonText color="danger">{editError}</IonText>
                  </IonCol>
                </IonRow>
              )}
              
              <IonRow>
                <IonCol>
                  <IonItem>
                    <IonLabel position="stacked">Użytkownik</IonLabel>
                    <IonSelect 
                      value={newDriver.uzytkownik_id} 
                      placeholder="Wybierz użytkownika"
                      onIonChange={e => handleNewDriverChange('uzytkownik_id', e.detail.value)}
                    >
                      {availableUsers.map(user => (
                        <IonSelectOption key={user.id} value={user.id}>
                          {user.email} {user.imie ? `(${user.imie})` : ''}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>
              
              <IonRow>
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Numer prawa jazdy</IonLabel>
                    <IonInput 
                      value={newDriver.numer_prawa_jazdy || ''} 
                      onIonInput={(e) => handleNewDriverChange('numer_prawa_jazdy', e.detail.value)}
                      placeholder="Wprowadź numer prawa jazdy"
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Model pojazdu</IonLabel>
                    <IonInput 
                      value={newDriver.model_pojazdu || ''} 
                      onIonInput={(e) => handleNewDriverChange('model_pojazdu', e.detail.value)}
                      placeholder="Wprowadź model pojazdu"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
              
              <IonRow>
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Numer rejestracyjny</IonLabel>
                    <IonInput 
                      value={newDriver.nr_rejestracyjny || ''} 
                      onIonInput={(e) => handleNewDriverChange('nr_rejestracyjny', e.detail.value)}
                      placeholder="Wprowadź numer rejestracyjny"
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Kolor pojazdu</IonLabel>
                    <IonInput 
                      value={newDriver.kolor_pojazdu || ''} 
                      onIonInput={(e) => handleNewDriverChange('kolor_pojazdu', e.detail.value)}
                      placeholder="Wprowadź kolor pojazdu"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
              
              <IonRow className="ion-margin-top">
                <IonCol>
                  <IonButton expand="block" onClick={handleAddDriver} disabled={busy}>
                    {busy ? <IonSpinner name="crescent" /> : 'Dodaj kierowcę'}
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>
        
        {/* Modal potwierdzenia usunięcia */}
        <IonModal isOpen={showDeleteModal} onDidDismiss={() => setShowDeleteModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Potwierdź usunięcie</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDeleteModal(false)}>
                  Zamknij
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonGrid>
              <IonRow>
                <IonCol>
                  <p>
                    Czy na pewno chcesz usunąć dane kierowcy #{selectedDriver?.uzytkownik_id}?
                    Ta operacja nie usunie konta użytkownika, tylko jego dane jako kierowcy.
                  </p>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={handleDeleteDriver} color="danger" disabled={busy}>
                    {busy ? <IonSpinner name="crescent" /> : 'Usuń dane kierowcy'}
                  </IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={() => setShowDeleteModal(false)}>
                    Anuluj
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>
        
        {/* Modal recenzji kierowcy */}
        <IonModal isOpen={showDetailsModal} onDidDismiss={() => setShowDetailsModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                Recenzje kierowcy {selectedDriver?.imie || selectedDriver?.email}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDetailsModal(false)}>
                  Zamknij
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonGrid>
              <IonRow>
                <IonCol>
                  <h2>Recenzje i oceny</h2>
                  <p>Średnia ocena: {typeof selectedDriver?.ocena === 'number' 
                    ? selectedDriver.ocena.toFixed(2) 
                    : (parseFloat(selectedDriver?.ocena || '5.00')).toFixed(2)}/5.00</p>
                </IonCol>
              </IonRow>
              
              {selectedDriverReviews.length > 0 ? (
                selectedDriverReviews.map((review, index) => (
                  <IonRow key={index} className="review-item">
                    <IonCol>
                      <IonItem lines="none">
                        <IonLabel>
                          <h3>{review.user_name || review.user_email}</h3>
                          <p className="review-rating">
                            Ocena: {review.ocena}/5 | {new Date(review.data_oceny).toLocaleDateString()}
                          </p>
                          <p className="review-text">{review.komentarz || 'Brak komentarza'}</p>
                        </IonLabel>
                        <IonButton
                          fill="clear"
                          color="danger"
                          onClick={() => confirmDeleteReview(review.id)}
                        >
                            <IonIcon icon={trashOutline} />
                        </IonButton>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                ))
              ) : (
                <IonRow>
                  <IonCol className="ion-text-center">
                    <p>Brak recenzji dla tego kierowcy</p>
                  </IonCol>
                </IonRow>
              )}
            </IonGrid>
          </IonContent>
        </IonModal>
        
        {/* Modal potwierdzenia usunięcia recenzji */}
        <IonModal isOpen={showDeleteReviewConfirm} onDidDismiss={() => setShowDeleteReviewConfirm(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Potwierdź usunięcie recenzji</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDeleteReviewConfirm(false)}>
                  Zamknij
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonGrid>
              <IonRow>
                <IonCol>
                  <p>
                    Czy na pewno chcesz usunąć tę recenzję?
                  </p>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={executeDeleteReview} color="danger" disabled={busy}>
                    {busy ? <IonSpinner name="crescent" /> : 'Usuń recenzję'}
                  </IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={() => setShowDeleteReviewConfirm(false)}>
                    Anuluj
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>
        
      </IonContent>
    </IonPage>
  );
};

export default AdminDriversPanel;