"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Menú lateral. Resalta la opción de la página actual.
export function Menu({ esAdmin }: { esAdmin: boolean }) {
  const ruta = usePathname();
  const opciones = [
    { href: "/", texto: "Inicio" },
    ...(esAdmin ? [{ href: "/usuarios", texto: "Usuarios" }] : []),
  ];

  return (
    <nav className="flex gap-1 md:flex-col">
      {opciones.map((op) => {
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
    </nav>
  );
}
