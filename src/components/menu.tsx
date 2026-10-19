"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Opcion = { href: string; texto: string };
// Una sección del menú: opciones sueltas (sin título) o un grupo con título.
export type SeccionMenu = { titulo?: string; opciones: Opcion[] };

// Menú lateral. Recibe solo las opciones que el perfil puede ver
// y resalta la de la página actual. Los grupos vacíos no se muestran.
export function Menu({ secciones }: { secciones: SeccionMenu[] }) {
  const ruta = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {secciones
        .filter((s) => s.opciones.length > 0)
        .map((s, i) => (
          <div key={s.titulo ?? i} className="flex flex-wrap items-center gap-1 md:flex-col md:items-stretch">
            {s.titulo && (
              <p className="w-full px-3 pt-2 text-sm font-bold text-violet-700 md:pt-4">{s.titulo}</p>
            )}
            {s.opciones.map((op) => {
              const activa = op.href === "/" ? ruta === "/" : ruta.startsWith(op.href);
              return (
                <Link
                  key={op.href}
                  href={op.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    activa ? "bg-violet-100 text-violet-700" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {op.texto}
                </Link>
              );
            })}
          </div>
        ))}
    </nav>
  );
}
