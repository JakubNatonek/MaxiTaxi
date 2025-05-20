export interface JwtPayload {
  id: number        // id
  userType: string; // Rola użytkownika
  email: string;    // Adres e-mail użytkownika
  exp: number;      // Czas wygaśnięcia tokena (opcjonalnie)
}