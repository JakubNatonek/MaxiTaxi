import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonModal,
  IonButton,
  IonToast,
  IonLabel,
  IonSpinner,
  IonAlert,
  IonButtons,
  IonMenuButton,
} from '@ionic/react';
import { star, starOutline, starHalfOutline } from 'ionicons/icons';
import './DriverRanking.css';

interface Driver {
  id: number;
  name: string;
  averageRating: number;
  totalReviews: number;
}

interface Review {
  user: string;
  text: string;
  date: string;
  rating: number;
}

interface DriverRankingProps {
  getEncryptedData: (endpoint: string) => Promise<any>;
}

const DriverRanking: React.FC<DriverRankingProps> = ({ getEncryptedData }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setIsLoading(true);
        console.log('Rozpoczęcie pobierania danych kierowców...');
        
        // Użycie getEncryptedData zamiast fetch
        const data = await getEncryptedData('api/ranking-kierowcow');
        console.log('Pobrano dane kierowców:', data);
        
        setDrivers(data);
      } catch (error) {
        console.error('Wystąpił błąd:', error);
        if (error instanceof Error) {
          setErrorDetails(`${error.message}`);
          setShowError(true);
        }
        setToastMessage('Błąd podczas pobierania danych kierowców.');
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, [getEncryptedData]);

  const handleDriverClick = async (driver: Driver) => {
    setSelectedDriver(driver);
    try {
      console.log(`Pobieranie recenzji dla kierowcy ${driver.id}...`);
      
      // Użycie getEncryptedData zamiast fetch
      const data = await getEncryptedData(`api/reviews/${driver.id}`);
      console.log('Pobrano recenzje:', data);
      
      setReviews(data);
      setShowModal(true);
    } catch (error) {
      console.error('Wystąpił błąd przy pobieraniu recenzji:', error);
      setToastMessage('Błąd podczas pobierania recenzji.');
      setShowToast(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDriver(null);
    setReviews([]);
  };

  const renderStars = (rating: any) => {
    // Konwersja na liczbę
    const numericRating = parseFloat(rating);
    
    // Sprawdzenie czy to prawidłowa liczba
    if (isNaN(numericRating)) {
      return Array(5).fill(0).map((_, i) => (
        <IonIcon key={i} icon={starOutline} color="warning" className="star-icon" />
      ));
    }
    
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<IonIcon key={i} icon={star} color="warning" className="star-icon" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<IonIcon key={i} icon={starHalfOutline} color="warning" className="star-icon" />);
      } else {
        stars.push(<IonIcon key={i} icon={starOutline} color="warning" className="star-icon" />);
      }
    }

    return stars;
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
        {isLoading ? (
          <div className="loading-container">
            <IonSpinner name="circular" />
            <p>Ładowanie rankingu kierowców...</p>
          </div>
        ) : (
          <IonList>
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <IonItem key={driver.id} button onClick={() => handleDriverClick(driver)}>
                  <IonLabel>
                    <h2>{driver.name}</h2>
                    <div className="rating-container">
                      <div className="stars-container">{renderStars(driver.averageRating)}</div>
                      <p className="rating-text">
                        {parseFloat(String(driver.averageRating)).toFixed(2)}/5 ({driver.totalReviews} {driver.totalReviews === 1 ? 'opinia' : 
                        driver.totalReviews > 1 && driver.totalReviews < 5 ? 'opinie' : 'opinii'})
                      </p>
                    </div>
                  </IonLabel>
                </IonItem>
              ))
            ) : (
              <IonItem>
                <IonLabel className="no-drivers-message">
                  Brak danych o kierowcach. 
                  {errorDetails && <p className="error-hint">Sprawdź konsolę przeglądarki.</p>}
                </IonLabel>
              </IonItem>
            )}
          </IonList>
        )}

        <IonModal isOpen={showModal} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar color="custom-orange">
              <IonTitle>Recenzje dla {selectedDriver?.name}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeModal}>
                  Zamknij
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <IonItem key={index} className="review-item">
                  <IonLabel>
                    <div className="review-header">
                      <h3>{review.user}</h3>
                      <div className="review-rating">{renderStars(review.rating)}</div>
                    </div>
                    <p className="review-text">{review.text || 'Brak komentarza'}</p>
                    <p className="review-date">{new Date(review.date).toLocaleDateString('pl-PL')}</p>
                  </IonLabel>
                </IonItem>
              ))
            ) : (
              <IonItem>
                <IonLabel>Brak recenzji dla tego kierowcy.</IonLabel>
              </IonItem>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
          buttons={[{
            text: 'OK',
            role: 'cancel'
          }]}
        />

        <IonAlert
          isOpen={showError}
          onDidDismiss={() => setShowError(false)}
          header="Szczegóły błędu"
          message={errorDetails || "Nieznany błąd"}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default DriverRanking;