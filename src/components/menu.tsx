"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Opcion = { href: string; texto: string };
// Una sección del menú: opciones sueltas (sin título) o un grupo con título.
export type SeccionMenu = { titulo?: string; opciones: Opcion[] };

function estaActiva(ruta: string, href: string) {
  return href === "/" ? ruta === "/" : ruta.startsWith(href);
}

// Menú lateral. Recibe solo las opciones que el perfil puede ver y resalta
// la de la página actual. Los grupos se abren y cierran con un clic; el grupo
// de la página actual empieza abierto. Los grupos vacíos no se muestran.
export function Menu({ secciones }: { secciones: SeccionMenu[] }) {
  const ruta = usePathname();
  // Grupos que la persona abrió o cerró a mano (los demás siguen la regla de arriba).
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

  return (
    <nav className="flex flex-col gap-1">
      {secciones
        .filter((s) => s.opciones.length > 0)
        .map((s, i) => {
          const contieneActiva = s.opciones.some((op) => estaActiva(ruta, op.href));
          const abierto = !s.titulo || (abiertos[s.titulo] ?? contieneActiva);

          return (
            <div key={s.titulo ?? i} className="flex flex-col gap-1">
              {s.titulo && (
                <button
                  type="button"
                  aria-expanded={abierto}
                  onClick={() => setAbiertos({ ...abiertos, [s.titulo!]: !abierto })}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold text-violet-700 hover:bg-violet-50"
                >
                  {s.titulo}
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    className={`h-4 w-4 transition-transform ${abierto ? "rotate-90" : ""}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.2 14.8a.75.75 0 0 1 0-1.06L10.94 10 7.2 6.27a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              {abierto && (
                <div className={`flex flex-wrap gap-1 md:flex-col ${s.titulo ? "md:pl-3" : ""}`}>
                  {s.opciones.map((op) => (
                    <Link
                      key={op.href}
                      href={op.href}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        estaActiva(ruta, op.href)
                          ? "bg-violet-100 text-violet-700"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {op.texto}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </nav>
  );
}
