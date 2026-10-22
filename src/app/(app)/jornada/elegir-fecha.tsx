"use client";

import { usePathname, useRouter } from "next/navigation";

// Cambia la fecha de la página (?fecha=AAAA-MM-DD) apenas se elige otra.
export function ElegirFecha({ fecha, maxima }: { fecha: string; maxima: string }) {
  const router = useRouter();
  const ruta = usePathname();
  return (
    <label className="block w-48">
      <span className="mb-1 block text-sm font-medium text-slate-700">Fecha</span>
      <input
        type="date"
        value={fecha}
        max={maxima}
        onChange={(e) => e.target.value && router.push(`${ruta}?fecha=${e.target.value}`)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200"
      />
    </label>
  );
}
