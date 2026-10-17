// Piezas visuales reutilizables (solo estilos, sin lógica).
import type { ComponentProps } from "react";

const variantes = {
  primario: "bg-violet-600 text-white hover:bg-violet-700",
  secundario: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
  peligro: "bg-red-600 text-white hover:bg-red-700",
};

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: keyof typeof variantes }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}

export function Campo({
  etiqueta,
  ...props
}: ComponentProps<"input"> & { etiqueta: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>
      <input
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        {...props}
      />
    </label>
  );
}

export function Selector({
  etiqueta,
  children,
  ...props
}: ComponentProps<"select"> & { etiqueta: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>
      <select
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Tarjeta({ className = "", ...props }: ComponentProps<"section">) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
      {...props}
    />
  );
}

export function Insignia({
  color,
  children,
}: {
  color: "violeta" | "gris" | "verde" | "rojo";
  children: React.ReactNode;
}) {
  const colores = {
    violeta: "bg-violet-100 text-violet-700",
    gris: "bg-slate-100 text-slate-600",
    verde: "bg-emerald-100 text-emerald-700",
    rojo: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colores[color]}`}>
      {children}
    </span>
  );
}
