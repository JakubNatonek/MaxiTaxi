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

import L, { map } from "leaflet";
import "./map.css";
import BookingMenu from "./BookingMenu";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "../../JwtPayLoad";
import { Order } from "../../OrderInt";

const SERVER = import.meta.env.VITE_REACT_APP_API_URL || "";

// console.log("SERVER:", import.meta.env.VITE_REACT_APP_API_URL);

interface MapComponentProps {
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>
  ) => Promise<any>;
  getEncryptedData: (endpoint: string) => Promise<any>;
  handlePageChange?: (page: string, params?: any) => void;
  orders: Order[]; // Opcjonalna lista zamówień
}

const MapComponent2: React.FC<MapComponentProps> = ({
  sendEncryptedData,
  getEncryptedData,
  handlePageChange = () => {},
  orders,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
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

  const [locationListVisible, setLocationListVisible] = useState(true);
  const searchbarRef = useRef<HTMLIonSearchbarElement>(null);
  const listRef = useRef<HTMLIonListElement>(null);

  const [showSearch, setShowSearch] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [alowBooking, setAlowBooking] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null); // Correct typing for mapRef
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchbar = searchbarRef.current;
      const list = listRef.current;
      const target = event.target as Node;
      // console.log("out");
      if (
        searchbar &&
        !searchbar.contains(target) &&
        list &&
        !list.contains(target)
      ) {
        setLocationListVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("jwt");

    let userRole = null;
    let userName = "";

    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        // console.log(decoded);
        userRole = decoded.roleId;
        if (userRole == 3) {
          setShowSearch(false);
          // Find active order (status "w trakcie" = 2)
          const activeOrder = orders.find(
            (order) => order.status === "w trakcie"
          );

          if (activeOrder && activeOrder.trasa_przejazdu) {
            // Decode the polyline to get coordinates
            const decodedCoordinates = polyline.decode(
              activeOrder.trasa_przejazdu
            );
            if (decodedCoordinates.length > 0) {
              // Get the first point from the route
              const firstPoint = decodedCoordinates[0];

              // Set as destination location
              setDestinationLocation({
                lat: firstPoint[0], // Latitude
                lng: firstPoint[1], // Longitude
              });
            }
          }
        }
        // userType = decoded.userType;
      } catch (err) {
        console.error("Błąd dekodowania tokena:", err);
      }
    }
  }, [orders]);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getUserLocation();
      // console.log("cos");
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize();
      }
    }, 100);
  }, [mapInstance]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      searchLocation();
    }, 1000); // Debounced for 500ms

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const searchLocation = async () => {
    if (searchQuery.trim()) {
      setLoading(true);
      // const url = `https://nominatim.openstreetmap.org/search?format=json&q=Warsaw&countrycodes=PL`
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&countrycodes=PL`;
      try {
        const response = await fetch(url);
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
    // console.log(searchData[index]);
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
      // console.log(data.routes[0].distance);
      // console.log(data.routes[0].duration/60);

      setRouteData(data);
      // console.log(data.routes[0].geometry)
      // Dekodowanie zakodowanego ciągu polyline
      const decodedCoordinates = polyline.decode(data.routes[0].geometry);
      // console.log(decodedCoordinates)
      // console.log(encodedPolyline)
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
    if (mapRef.current && userLocation && !mapInstance) {
      const map = L.map(mapRef.current).setView(
        [userLocation.lat, userLocation.lng],
        13
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      // Dodanie markera dla bieżącej lokalizacji

      setMapInstance(map);
    }
  }, [userLocation, mapInstance]);

  useEffect(() => {
    if (mapInstance && userLocation) {
      // Usuń poprzedni marker jeśli istnieje
      if (userMarkerRef.current) {
        mapInstance.removeLayer(userMarkerRef.current);
      }

      // Dodaj nowy marker
      const marker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 6,
        color: "#00c8ff",
        fillColor: "#dff5f5",
        fillOpacity: 1,
      })
        .addTo(mapInstance)
        .bindPopup("Twoja lokalizacja");

      userMarkerRef.current = marker; // Zapisz referencję
    }
  }, [userLocation, mapInstance]);

  const handleTrasGeneration = async () => {
    // console.log("Trasa");
    const start = userLocation;
    const end = destinationLocation;
    if (start && end) {
      setAlowBooking(false);
      const routeData = await fetchRoute(start, end);
      // console.log(calculateTotalDistance(routeData))

      if (mapInstance) {
        // Usuwanie poprzednich warstw (jeśli istnieją)
        mapInstance.eachLayer((layer) => {
          if (layer instanceof L.Polyline) {
            mapInstance.removeLayer(layer);
          }
        });

        const routePolyline = L.polyline(routeData, { color: "blue" }).addTo(
          mapInstance
        );
        mapInstance.fitBounds(routePolyline.getBounds());
        // setShowSearch(false);
        setAlowBooking(true);
      }
    }
  };
  // Funkcja haversine do obliczania dystansu między dwoma punktami (w kilometrach)
  function haversineDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const toRad = (deg: number): number => (deg * Math.PI) / 180;

    const R = 6371; // promień Ziemi w km
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Oblicz całkowitą długość trasy
  function calculateTotalDistance(coords: [number, number][]): number {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      total += haversineDistance(coords[i - 1], coords[i]);
    }
    return total;
  }

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
              <img src="/assets/menu_logo.png" alt="MaxiTaxi Logo" />
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen className="no-padding">
          <IonRow className="ion-padding">
            <IonCol>
              {showSearch && (
                <IonSearchbar
                  class="custom-searchbar"
                  debounce={1000}
                  onIonInput={handleInput}
                  ref={searchbarRef}
                  onClick={() => setLocationListVisible(true)}
                />
              )}
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol className="ion-text-center">
              <IonList className="search-list" ref={listRef}>
                {locationListVisible &&
                  showSearch &&
                  searchData.map((result, index) => (
                    <IonItem
                      key={index}
                      onClick={() => handleSelectedLocalization(index)}
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

          <IonButton
            onClick={() => {
              handleTrasGeneration();
            }}
            expand="full"
            color="primary"
          >
            Wyznacz Trasę
          </IonButton>
          {alowBooking && showSearch && (
            <IonButton
              onClick={() => {
                console.log(showBooking);
                setShowBooking(true);
              }}
              expand="full"
              color="primary"
            >
              Zamów
            </IonButton>
          )}
          <IonRow>
            <BookingMenu
              size={0.7}
              openIs={showBooking}
              setShowBooking={setShowBooking}
              sendEncryptedData={sendEncryptedData}
              getEncryptedData={getEncryptedData}
              routeData={routeData}
              handlePageChange={handlePageChange}
            />
          </IonRow>
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default MapComponent2;
