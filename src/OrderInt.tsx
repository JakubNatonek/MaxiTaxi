export interface Order {
  zlecenie_id: number; // ID zlecenia
  cena: string; // Cena przejazdu
  data_zamowienia: string; // Data zamówienia
  data_zakonczenia: string | null; // Data zakończenia (może być null)
  dystans_km: string; // Dystans w kilometrach
  kierowca_id: number; // ID kierowcy
  kierowca_imie: string; // Imię kierowcy
  pasazer_id: number; // ID pasażera
  pasazer_imie: string; // Imię pasażera (może być "NULL")
  status: string; // Status zlecenia (np. "zlecono")
  trasa_przejazdu: string; // Zakodowana trasa przejazdu (np. w formacie polyline)
}
