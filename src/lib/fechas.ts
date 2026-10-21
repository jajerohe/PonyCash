// Fechas y valores en el formato de Colombia. Las fechas viajan como texto
// "AAAA-MM-DD" (así las guarda la base de datos en columnas "date").

const ZONA = "America/Bogota";

// Fecha de hoy en Colombia, como "AAAA-MM-DD".
export function hoy() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

// Último día del año en curso, como "AAAA-12-31".
export function finDeAnio() {
  return `${hoy().slice(0, 4)}-12-31`;
}

export function esFechaValida(texto: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(texto);
}

// "2026-10-21" → "21/10/2026"
export function formatearFecha(texto: string) {
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
}

// 15000 → "$ 15.000"
export function formatearPesos(valor: number) {
  return `$ ${valor.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

export type Vigencia = "vigente" | "vencida" | "proxima";

export function vigencia(desde: string, hasta: string, dia = hoy()): Vigencia {
  if (hasta < dia) return "vencida";
  if (desde > dia) return "proxima";
  return "vigente";
}
