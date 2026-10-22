"use client";

// Caja para escribir una cantidad de manillas (entero >= 0) en las tablas de
// entradas, entregas y cierres.
export function CampoCantidad({
  name,
  etiqueta,
  defaultValue,
  max,
  onCambio,
}: {
  name: string;
  etiqueta: string;
  defaultValue?: number;
  max?: number;
  onCambio?: (cantidad: number | null) => void; // null = vacío
}) {
  return (
    <input
      name={name}
      aria-label={etiqueta}
      type="number"
      inputMode="numeric"
      min={0}
      max={max}
      step={1}
      defaultValue={defaultValue}
      placeholder="0"
      onChange={(e) => onCambio?.(e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value) || 0)))}
      onWheel={(e) => e.currentTarget.blur()} // Que la rueda del ratón no cambie el número
      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-right tabular-nums outline-none [appearance:textfield] focus:border-marca-500 focus:ring-2 focus:ring-marca-200 [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

export function sumarCantidades(cantidades: Record<number, number>) {
  return Object.values(cantidades).reduce((a, b) => a + b, 0);
}
