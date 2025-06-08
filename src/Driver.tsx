export interface Driver {
  uzytkownik_id: number;
  imie_kierowcy: string; 
  dystans_km: number;
  model_pojazdu?: string;
  nr_rejestracyjny?: string;
  kolor_pojazdu?: string;
  ocena?: number;
  szerokosc_geo: number;      // Added - latitude coordinate
  dlugosc_geo: number;        // Added - longitude coordinate
  zaktualizowano: string;     // Added - timestamp of last location update
}