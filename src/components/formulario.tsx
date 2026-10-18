"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import type { Estado } from "@/lib/errores";
import { Boton } from "./ui";

// Formulario que llama a una Server Action, muestra "Guardando…"
// mientras espera y el mensaje (éxito o error) que devuelve la acción.
// Los campos conservan lo escrito, para corregir sin volver a llenar todo.
export function Formulario({
  accion,
  children,
  textoBoton,
  variante = "primario",
  confirmar,
  anchoCompleto = false,
  limpiarAlGuardar = false,
  className = "space-y-4",
}: {
  accion: (estado: Estado, datos: FormData) => Promise<Estado>;
  children?: ReactNode;
  textoBoton: string;
  variante?: "primario" | "secundario" | "peligro";
  confirmar?: string;
  anchoCompleto?: boolean;
  limpiarAlGuardar?: boolean;
  className?: string;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, null);
  const formulario = useRef<HTMLFormElement>(null);

  // Después de guardar con éxito, deja el formulario listo para el siguiente registro.
  useEffect(() => {
    if (limpiarAlGuardar && estado?.ok) formulario.current?.reset();
  }, [estado, limpiarAlGuardar]);

  return (
    <form
      ref={formulario}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmar && !window.confirm(confirmar)) return;
        const datos = new FormData(e.currentTarget);
        startTransition(() => enviar(datos));
      }}
    >
      {children}
      {estado && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            estado.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {estado.mensaje}
        </p>
      )}
      <Boton
        type="submit"
        variante={variante}
        disabled={pendiente}
        className={anchoCompleto ? "w-full" : ""}
      >
        {pendiente ? "Guardando…" : textoBoton}
      </Boton>
    </form>
  );
}
