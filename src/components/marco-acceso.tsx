import type { ReactNode } from "react";

// Marco de las pantallas sin sesión: logo, título, subtítulo y una tarjeta.
export function MarcoAcceso({
  subtitulo,
  children,
  pie,
}: {
  subtitulo: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white shadow-lg shadow-violet-200">
            P
          </div>
          <h1 className="text-2xl font-bold">PonyCash</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
        {pie && <div className="mt-4 text-center text-sm">{pie}</div>}
      </div>
    </main>
  );
}
