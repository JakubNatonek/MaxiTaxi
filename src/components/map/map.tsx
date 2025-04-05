import React, { useState, useEffect, useRef } from "react";
import {
  IonApp,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonPage,
  IonButtons,
  IonMenuButton,
  IonRow,
  IonCol,
  IonButton,
  IonList,
  IonItem,
  IonSearchbar,
} from "@ionic/react";

import "leaflet/dist/leaflet.css";

import polyline from "polyline";

import L from "leaflet";
import "./map.css";

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";

// console.log("SERVER:", import.meta.env.VITE_REACT_APP_API_URL);

interface MapComponentProps {
  latitude?: number;
  longitude?: number;
}

const MapComponent2: React.FC<MapComponentProps> = ({
  latitude,
  longitude,
}) => {
  
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [startLocation, setStartLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchData, setSearchData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [route, setRoute] = useState<any[]>([]);

  useEffect(() => {
    if (!latitude || !longitude) {
      getUserLocation();
    }
  }, [latitude, longitude]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      searchLocation();
    }, 500); // Debounced for 500ms

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Błąd geolokalizacji: ", error);
        }
      );
    }
  };

  const searchLocation = async () => {
    if (searchQuery.trim()) {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&countrycodes=PL`
        );
        const data = await response.json();
        if (data.length > 0) {
          setSearchData(data); // Store search results
        } else {
          setSearchData([]); // Clear results if no matches
        }
      } catch (error) {
        console.error("Błąd podczas wyszukiwania:", error);
        setSearchData([]); // Clear results on error
      } finally {
        setLoading(false);
      }
    } else {
      setSearchData([]); // Clear results if searchQuery is empty
    }
  };

  const handleInput = (event: Event) => {
    const target = event.target as HTMLIonSearchbarElement;
    setSearchQuery(target.value || "");
  };

  const handleSelectedLocalization = (index: number) => {
    const selectedLocation = searchData[index];
    setDestinationLocation({
      lat: parseFloat(selectedLocation.lat),
      lng: parseFloat(selectedLocation.lon),
    });
    setMapLocation({
      lat: parseFloat(selectedLocation.lat),
      lng: parseFloat(selectedLocation.lon),
    });
  };

  const fetchRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&steps=true`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      // return data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
      const encodedPolyline = data.routes[0].geometry;

      // Dekodowanie zakodowanego ciągu polyline
      const decodedCoordinates = polyline.decode(encodedPolyline);

      // Zwracamy dane w formie [lat, lng], bo Leaflet oczekuje [lat, lng] dla polilinii
      return decodedCoordinates.map(
        (coord) => [coord[0], coord[1]] as [number, number]
      ); // Konwertowanie na typ [number, number]
    } catch (error) {
      console.error("Błąd podczas wyznaczania trasy:", error);
      return [];
    }
  };

  // leaflet
  //polyline

  useEffect(() => {
    getUserLocation();
  }, []);

  const mapRef = useRef<HTMLDivElement | null>(null); // Correct typing for mapRef
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && userLocation && !mapInstance) {
      const map = L.map(mapRef.current).setView(
        [userLocation.lat, userLocation.lng],
        13
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      // Dodanie markera dla bieżącej lokalizacji
      L.marker([userLocation.lat, userLocation.lng]).addTo(map);

      setMapInstance(map);
    }
  }, [userLocation, mapInstance]);

  const handleTrasGeneration = async () => {
    const start = userLocation;
    if (start && destinationLocation) {
      const routeData = await fetchRoute(start, destinationLocation);
      if (mapInstance) {
        // Usuwanie poprzednich warstw (jeśli istnieją)
        mapInstance.eachLayer((layer) => {
          if (layer instanceof L.Polyline) {
            mapInstance.removeLayer(layer);
          }
        });

        // Dodanie nowej trasy
        if (routeData.length > 0) {
          const routePolyline = L.polyline(routeData, { color: "blue" }).addTo(
            mapInstance
          );
          mapInstance.fitBounds(routePolyline.getBounds());
        }
      }
    }
  };

  const [routeUrl, setRouteUrl] = useState<string>("");
  const generateRouteUrl = (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ) => {
    // Generowanie URL do wyznaczenia trasy w OpenStreetMap
    return `https://www.openstreetmap.org/directions?engine=fossgis_osm_router&route=${start.lat},${start.lng};${end.lat},${end.lng}#map=14/${start.lat}/${start.lng}`;
  };

  const mapLatitude = mapLocation?.lat || (userLocation && userLocation.lat);
  const mapLongitude = mapLocation?.lng || (userLocation && userLocation.lng);

  if (!mapLatitude || !mapLongitude) {
    return <div>Ładowanie...</div>;
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    mapLongitude - 0.05
  }%2C${mapLatitude - 0.05}%2C${mapLongitude + 0.05}%2C${
    mapLatitude + 0.05
  }&layer=transport&marker=${mapLatitude},${mapLongitude}`;

  return (
    <IonApp>
      {/* ===== STRONA MAPY ===== */}
      <IonPage id="main">
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

        <IonContent fullscreen className="no-padding">
          <IonRow className="ion-padding">
            <IonCol>
              <IonSearchbar debounce={500} onIonInput={handleInput} />
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol className="ion-text-center">
              <IonList className="search-list">
                {searchData.map((result, index) => (
                  <IonItem
                    onClick={(event) => handleSelectedLocalization(index)}
                    key={index}
                  >
                    {result.display_name}
                  </IonItem>
                ))}
              </IonList>
              <div id="map">
                <div
                  id="map"
                  className="map"
                  ref={mapRef}
                  style={{ height: "500px", width: "100%" }}
                ></div>
              </div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonButtons onClick={handleTrasGeneration}>
              Wyznacz Trase
            </IonButtons>
          </IonRow>
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default MapComponent2;
