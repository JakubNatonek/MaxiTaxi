import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText,
  IonModal,
  IonLoading,
  IonSearchbar,
  IonDatetime,
} from "@ionic/react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "polyline";
import "./AdminRidesPanel.css";

interface Ride {
  id: number;
  pasazer_id: number;
  pasazer_imie: string;
  pasazer_email: string;
  kierowca_id: number;
  kierowca_imie: string;
  kierowca_email: string;
  dystans_km: string;
  cena: string;
  data_zamowienia: string;
  data_rozpoczecia: string | null;
  data_zakonczenia: string | null;
  status: string;
  status_id: number;
  trasa_przejazdu?: string;
}

interface RideStatus {
  id: number;
  nazwa: string;
}

interface User {
  id: number;
  imie: string;
  email: string;
  rola_nazwa: string;  
}

interface Statistics {
  total_rides: number | string;
  total_revenue: number | string;
  avg_price: number | string;
  avg_distance: number | string;
  pending_rides: number | string;
  active_rides: number | string;
  completed_rides: number | string;
  cancelled_rides: number | string;
}

interface AdminRidesPanelProps {
  getEncryptedData: (endpoint: string) => Promise<any>;
  sendEncryptedData: (endpoint: string, data: Record<string, unknown>, method?: string) => Promise<any>;
}

const AdminRidesPanel: React.FC<AdminRidesPanelProps> = ({ getEncryptedData, sendEncryptedData }) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [statuses, setStatuses] = useState<RideStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";

  useEffect(() => {
    fetchRides();
    fetchStatuses();
    fetchUsers();
    fetchStatistics();
  }, []);

  // Automatyczne odświeżanie danych co 5 sekund
  useEffect(() => {
    // Pierwsze pobranie danych
    fetchRides(true);
    fetchStatistics(true);
    
    // Ustawienie interwału odświeżania danych
    const interval = setInterval(() => {
      fetchRides(true); // true = ciche odświeżanie bez wskaźnika ładowania
      fetchStatistics(true);
    }, 5000);

    // Funkcja czyszcząca interwał po odmontowaniu komponentu
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (search || statusFilter !== null) {
      let results = [...rides];
      
      if (search) {
        const searchLower = search.toLowerCase();
        results = results.filter(
          ride => 
            ride.pasazer_email.toLowerCase().includes(searchLower) ||
            ride.kierowca_email.toLowerCase().includes(searchLower) ||
            ride.id.toString().includes(searchLower)
        );
      }
      
      if (statusFilter !== null) {
        results = results.filter(ride => ride.status_id === statusFilter);
      }
      
      setFilteredRides(results);
    } else {
      setFilteredRides(rides);
    }
  }, [search, statusFilter, rides]);

  const fetchRides = async (silentRefresh = false) => {
    try {
      // Pokazuj wskaźnik ładowania tylko gdy nie jest to ciche odświeżanie
      if (!silentRefresh) {
        setBusy(true);
      }
      const data = await getEncryptedData("admin/rides");
      setRides(data);
      setFilteredRides(data);
    } catch (error) {
      console.error("Błąd pobierania przejazdów:", error);
    } finally {
      if (!silentRefresh) {
        setBusy(false);
      }
    }
  };

  const fetchStatuses = async () => {
    try {
      const data = await getEncryptedData("admin/ride-statuses");
      setStatuses(data);
    } catch (error) {
      console.error("Błąd pobierania statystyk:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getEncryptedData("users");
      setUsers(data);
    } catch (error) {
      console.error("Błąd pobierania użytkowników:", error);
    }
  };

  const fetchStatistics = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) {
        setBusy(true);
      }
      const data = await getEncryptedData("admin/rides/stats/summary");
      if (data) {
        setStatistics(data);
      } else {
        console.error("Nie otrzymano danych statystyk");
        setStatistics(null);
      }
    } catch (error) {
      console.error("Błąd podczas pobierania statystyk:", error);
      setStatistics(null);
    } finally {
      if (!silentRefresh) {
        setBusy(false);
      }
    }
  };

  const handleViewRide = async (ride: Ride) => {
    try {
      setBusy(true);
      const data = await getEncryptedData(`admin/rides/${ride.id}`);
      setSelectedRide(data);
      setShowRideModal(true);
      
      setTimeout(() => {
        if (mapRef.current && data.trasa_przejazdu) {
          if (mapInstance) mapInstance.remove();
          
          const map = L.map(mapRef.current).setView([50.049683, 19.944544], 12);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors"
          }).addTo(map);
          
          setMapInstance(map);

          try {
            const routeGeometry = data.trasa_przejazdu;
            const decodedCoordinates = polyline.decode(routeGeometry);
            const routePoints = decodedCoordinates.map(
              coord => [coord[0], coord[1]] as [number, number]
            );
            
            if (routePoints.length > 0) {
              const routeLine = L.polyline(routePoints, { color: 'blue', weight: 5 }).addTo(map);
              
              const startPoint = routePoints[0];
              const endPoint = routePoints[routePoints.length - 1];
              
              L.marker(startPoint, { title: "Miejsce startowe" })
                .addTo(map)
                .bindPopup("Miejsce startowe")
                .openPopup();
                
              L.marker(endPoint, { title: "Miejsce docelowe" })
                .addTo(map)
                .bindPopup("Miejsce docelowe");
                
              map.fitBounds(routeLine.getBounds());
            }
          } catch (err) {
            console.error("Błąd wyświetlania trasy:", err);
          }
        }
      }, 300);
    } catch (error) {
      console.error("Błąd pobierania detali trasy:", error);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveRide = async () => {
    if (!selectedRide) return;
    
    try {
      setBusy(true);
      // Wysyłamy tylko te pola, które mogą być edytowane
      const updateData = {
        // Zachowujemy oryginalne ID użytkowników
        pasazer_id: selectedRide.pasazer_id,
        kierowca_id: selectedRide.kierowca_id,
        // Edytowalne pola:
        cena: selectedRide.cena,
        dystans_km: selectedRide.dystans_km,
        status_id: selectedRide.status_id,
        // Zachowujemy oryginalne daty
        data_rozpoczecia: selectedRide.data_rozpoczecia,
        data_zakonczenia: selectedRide.data_zakonczenia
      };

      // Wyraźnie przekazujemy "PUT" jako trzeci parametr
      await sendEncryptedData(`admin/rides/${selectedRide.id}`, updateData, "PUT");
      setShowRideModal(false);
      fetchRides();
      setEditError(null);
    } catch (error: any) {
      console.error("Błąd podczas zapisywania przejazdu:", error);
      setEditError(error.message || "Błąd podczas aktualizacji przejazdu");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRide = async () => {
    if (!selectedRide) return;
    
    try {
      setBusy(true);
      const updateData = {
        pasazer_id: selectedRide.pasazer_id,
        kierowca_id: selectedRide.kierowca_id,
        cena: selectedRide.cena,
        dystans_km: selectedRide.dystans_km,
        status_id: 5, 
        data_rozpoczecia: selectedRide.data_rozpoczecia,
        data_zakonczenia: selectedRide.data_zakonczenia || new Date().toISOString()
      };
      
      await sendEncryptedData(`admin/rides/${selectedRide.id}`, updateData, "PUT");
      
      setShowDeleteModal(false);
      setShowRideModal(false);
      fetchRides();
      fetchStatistics();
    } catch (error: any) {
      setEditError(error.message || "Błąd podczas anulowania przejazdu");
    } finally {
      setBusy(false);
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
            <img src="/assets/menu_logo.png" alt="MaxiTaxi Logo" />
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonLoading isOpen={busy} message="Proszę czekać..." />
        
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <h2 className="admin-panel-title">Panel zarządzania przejazdami</h2>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="12" size-md="8">
              <IonSearchbar
                value={search}
                onIonChange={(e) => setSearch(e.detail.value!)}
                placeholder="Szukaj po ID, email pasażera lub kierowcy"
                animated
              />
            </IonCol>
            <IonCol size="12" size-md="4">
              <IonItem>
                <IonLabel>Filtruj po statusie:</IonLabel>
                <IonSelect
                  value={statusFilter}
                  onIonChange={(e) => setStatusFilter(e.detail.value)}
                  placeholder="Wszystkie"
                >
                  <IonSelectOption value={null}>Wszystkie</IonSelectOption>
                  {statuses.map((status) => (
                    <IonSelectOption key={status.id} value={status.id}>
                      {status.nazwa}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="12" className="ion-text-end">
              <IonButton onClick={() => setShowStatsModal(true)} color="primary">
                Statystyki przejazdów
              </IonButton>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="12">
              <div className="table-container">
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Pasażer</th>
                      <th>Kierowca</th>
                      <th>Data zamówienia</th>
                      <th>Cena (zł)</th>
                      <th>Dystans (km)</th>
                      <th>Status</th>
                      <th>Akcja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRides.map((ride) => (
                      <tr key={ride.id}>
                        <td>{ride.id}</td>
                        <td>{ride.pasazer_email}</td>
                        <td>{ride.kierowca_email}</td>
                        <td>{new Date(ride.data_zamowienia).toLocaleString()}</td>
                        <td>{parseFloat(ride.cena).toFixed(2)}</td>
                        <td>{parseFloat(ride.dystans_km).toFixed(2)}</td>
                        <td>{ride.status}</td>
                        <td>
                          <IonButton
                            size="small"
                            onClick={() => handleViewRide(ride)}
                          >
                            Szczegóły
                          </IonButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        {/* Ride Details Modal */}
        <IonModal isOpen={showRideModal} onDidDismiss={() => setShowRideModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Szczegóły przejazdu</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowRideModal(false)}>
                  Zamknij
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedRide && (
              <IonGrid>
                {editError && (
                  <IonRow>
                    <IonCol>
                      <IonText color="danger">{editError}</IonText>
                    </IonCol>
                  </IonRow>
                )}
                
                {/* Nieedytowalne pola - tylko do odczytu */}
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">ID przejazdu</IonLabel>
                      <IonInput value={selectedRide.id} disabled />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Pasażer</IonLabel>
                      <IonInput value={selectedRide.pasazer_email} disabled />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Kierowca</IonLabel>
                      <IonInput value={selectedRide.kierowca_email} disabled />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Data zamówienia</IonLabel>
                      <IonInput value={selectedRide.data_zamowienia} disabled />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Data rozpoczęcia</IonLabel>
                      <IonInput value={selectedRide.data_rozpoczecia || 'Nie rozpoczęto'} disabled />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Data zakończenia</IonLabel>
                      <IonInput value={selectedRide.data_zakonczenia || 'Nie zakończono'} disabled />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                {/* EDYTOWALNE POLA */}
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Cena (zł)</IonLabel>
                      <IonInput
                        type="number"
                        value={selectedRide.cena}
                        onIonChange={(e) => {
                          setSelectedRide({
                            ...selectedRide,
                            cena: parseFloat(e.detail.value || "0").toString(),
                          });
                        }}
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <IonItem>
                      <IonLabel position="stacked">Dystans (km)</IonLabel>
                      <IonInput
                        type="number"
                        value={selectedRide.dystans_km}
                        onIonChange={(e) => {
                          setSelectedRide({
                            ...selectedRide,
                            dystans_km: parseFloat(e.detail.value || "0").toString(),
                          });
                        }}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel position="stacked">Status</IonLabel>
                      <IonSelect
                        value={selectedRide.status_id}
                        onIonChange={(e) => {
                          setSelectedRide({
                            ...selectedRide,
                            status_id: e.detail.value,
                          });
                        }}
                      >
                        {statuses.map((status) => (
                          <IonSelectOption key={status.id} value={status.id}>
                            {status.nazwa}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                </IonRow>
                
                {/* Przyciski akcji */}
                <IonRow className="ion-margin-top">
                  <IonCol>
                    <IonButton expand="block" onClick={handleSaveRide}>
                      Zapisz zmiany
                    </IonButton>
                  </IonCol>
                  <IonCol>
                    <IonButton expand="block" color="danger" onClick={() => setShowDeleteModal(true)}>
                      Zamknij przejazd
                    </IonButton>
                  </IonCol>
                </IonRow>
                
                {/* Mapa */}
                <IonRow>
                  <IonCol>
                    <h4>Trasa przejazdu</h4>
                    <div ref={mapRef} style={{ height: "300px" }}></div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            )}
          </IonContent>
        </IonModal>
        
        {/* Delete Confirmation Modal */}
        <IonModal isOpen={showDeleteModal} onDidDismiss={() => setShowDeleteModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Potwierdź usunięcie</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonGrid>
              <IonRow>
                <IonCol>
                  <p>
                    Czy na pewno chcesz zamknąć przejazd #{selectedRide?.id}?
                  </p>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={handleDeleteRide} color="danger">
                    Zamknij przejazd
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
        
        {/* Statistics Modal */}
        <IonModal isOpen={showStatsModal} onDidDismiss={() => setShowStatsModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Statystyki przejazdów</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowStatsModal(false)}>
                  Zamknij
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {statistics ? (
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <div className="stat-card">
                      <h2>Łączna liczba przejazdów</h2>
                      <p className="stat-value">{statistics.total_rides || 0}</p>
                    </div>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <div className="stat-card">
                      <h2>Łączny przychód</h2>
                      <p className="stat-value">
                        {statistics.total_revenue !== null && statistics.total_revenue !== undefined
                          ? parseFloat(String(statistics.total_revenue)).toFixed(2) 
                          : "0.00"} zł
                      </p>
                    </div>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12" size-md="6">
                    <div className="stat-card">
                      <h2>Średnia cena przejazdu</h2>
                      <p className="stat-value">
                        {statistics.avg_price !== null && statistics.avg_price !== undefined
                          ? parseFloat(String(statistics.avg_price)).toFixed(2)
                          : "0.00"} zł
                      </p>
                    </div>
                  </IonCol>
                  <IonCol size="12" size-md="6">
                    <div className="stat-card">
                      <h2>Średni dystans</h2>
                      <p className="stat-value">
                        {statistics.avg_distance !== null && statistics.avg_distance !== undefined
                          ? parseFloat(String(statistics.avg_distance)).toFixed(2)
                          : "0.00"} km
                      </p>
                    </div>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12">
                    <h3 className="ion-text-center">Przejazdy według statusu</h3>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="6" size-md="3">
                    <div className="stat-card">
                      <h3>Oczekujące</h3>
                      <p className="stat-value">{statistics.pending_rides || 0}</p>
                    </div>
                  </IonCol>
                  <IonCol size="6" size-md="3">
                    <div className="stat-card">
                      <h3>Aktywne</h3>
                      <p className="stat-value">{statistics.active_rides || 0}</p>
                    </div>
                  </IonCol>
                  <IonCol size="6" size-md="3">
                    <div className="stat-card">
                      <h3>Ukończone</h3>
                      <p className="stat-value">{statistics.completed_rides || 0}</p>
                    </div>
                  </IonCol>
                  <IonCol size="6" size-md="3">
                    <div className="stat-card">
                      <h3>Anulowane</h3>
                      <p className="stat-value">{statistics.cancelled_rides || 0}</p>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            ) : (
              <div className="ion-text-center ion-padding">
                <p>Ładowanie statystyk...</p>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminRidesPanel;