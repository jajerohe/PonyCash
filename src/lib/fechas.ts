// El parque está en Colombia: "hoy" se calcula con la hora de Bogotá.
export function hoy() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

// "2026-10-18" → "18/10/2026"
export function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

// Acepta solo fechas con formato AAAA-MM-DD.
export function esFechaValida(fecha: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha));
}
