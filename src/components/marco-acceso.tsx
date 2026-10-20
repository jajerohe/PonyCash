import type { ReactNode } from "react";
import { Logo } from "./logo";

// Marco de las pantallas sin sesión: logo, título, subtítulo y una tarjeta.
export function MarcoAcceso({
  titulo = "PonyCash",
  subtitulo,
  children,
  pie,
}: {
  titulo?: string;
  subtitulo: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-cielo-100 via-crema-50 to-crema-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo tamano={150} className="mx-auto mb-3 drop-shadow-md" />
          <h1 className="text-2xl font-bold text-marca-800">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
        {pie && <div className="mt-4 text-center text-sm">{pie}</div>}
      </div>
    </main>
  );
}
