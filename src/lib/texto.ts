// Quita tildes y mayúsculas para que "nino" encuentre "Niño".
export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
