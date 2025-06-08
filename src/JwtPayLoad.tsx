export interface JwtPayload {
  id: number;         // id użytkownika
  roleId: number;     // id roli z rola_as_uzytkownik
  email: string;      // Adres e-mail użytkownika
  exp: number;        // Czas wygaśnięcia tokena
}