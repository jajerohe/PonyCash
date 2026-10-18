// 25000 → "$ 25.000"
export function formatearPesos(valor: number) {
  return "$ " + valor.toLocaleString("es-CO", { maximumFractionDigits: 0 });
}

// Lee un valor escrito por el usuario: "25000", "25.000" o "$ 25.000".
// Devuelve null si está vacío y NaN si no es un número entero válido.
export function leerPesos(texto: string) {
  const limpio = texto.replace(/[$\s.]/g, "");
  if (limpio === "") return null;
  return /^\d+$/.test(limpio) ? Number(limpio) : NaN;
}
