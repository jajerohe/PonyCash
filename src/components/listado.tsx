"use client";

// Piezas compartidas de los listados (productos, tipos de tarifa, tarifas, usuarios…):
// cabecera con buscador, barra de botones redondos, ventana con formulario
// y el estado de la fila seleccionada.
import { startTransition, useActionState, useEffect, useState, type ReactNode } from "react";
import { Boton } from "@/components/ui";
import type { Estado } from "@/lib/errores";

export { normalizar } from "@/lib/texto";

// Fila seleccionada, ventana abierta, aviso y acciones en curso.
// El id es un número, salvo en listados como el de usuarios, que usan texto.
export function useListado<Id = number>() {
  const [seleccionadaId, setSeleccionadaId] = useState<Id | null>(null);
  const [ventana, setVentana] = useState<"crear" | "editar" | null>(null);
  const [aviso, setAviso] = useState<Estado>(null);
  const [ocupado, setOcupado] = useState(false);

  function ejecutar(accion: () => Promise<Estado>, despues?: () => void) {
    setOcupado(true);
    startTransition(async () => {
      const resultado = await accion();
      setAviso(resultado);
      setOcupado(false);
      if (resultado?.ok) despues?.();
    });
  }

  return { seleccionadaId, setSeleccionadaId, ventana, setVentana, aviso, setAviso, ocupado, ejecutar };
}

// Título, etiqueta del buscador, botones a la derecha y caja de búsqueda.
export function CabeceraListado({
  titulo,
  buscar,
  placeholder,
  busqueda,
  onBuscar,
  botones,
}: {
  titulo: string;
  buscar: string;
  placeholder: string;
  busqueda: string;
  onBuscar: (texto: string) => void;
  botones?: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-6 w-6" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path strokeLinecap="round" d="m15.5 15.5 5 5" />
            </svg>
            {buscar}
          </label>
        </div>
        {botones}
      </div>

      <input
        id="buscar"
        type="search"
        value={busqueda}
        onChange={(e) => onBuscar(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200"
      />
    </>
  );
}

// Botón redondo de la barra de acciones.
function BotonAccion({
  titulo,
  color,
  deshabilitado,
  onClick,
  children,
}: {
  titulo: string;
  color: string;
  deshabilitado?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      disabled={deshabilitado}
      onClick={onClick}
      className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100 ${color}`}
    >
      {children}
    </button>
  );
}

const icono = "h-6 w-6";

// Crear (verde), editar (azul), activar/desactivar (amarillo) y eliminar (rojo).
// Cada botón se apaga con su propio "sin…" cuando no aplica.
export function BarraAcciones({
  singular,
  activa,
  sinEditar,
  sinCambiarEstado,
  sinEliminar,
  onCrear,
  onEditar,
  onCambiarEstado,
  onEliminar,
  onCargar,
}: {
  singular: string;
  activa: boolean;
  sinEditar: boolean;
  sinCambiarEstado: boolean;
  sinEliminar: boolean;
  onCrear: () => void;
  onEditar: () => void;
  onCambiarEstado: () => void;
  onEliminar: () => void;
  // Si se pasa, aparece un quinto botón para cargar registros desde un archivo.
  onCargar?: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-crema-100/70 px-4 py-3">
      <BotonAccion titulo={`Crear ${singular}`} color="bg-gradient-to-b from-lime-500 to-lime-700" onClick={onCrear}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={icono} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path strokeLinecap="round" d="M12 8v8M8 12h8" />
        </svg>
      </BotonAccion>
      <BotonAccion titulo={`Editar ${singular}`} color="bg-sky-500" deshabilitado={sinEditar} onClick={onEditar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4 20 1-4L16 5a2 2 0 0 1 3 3L8 19l-4 1Z" />
        </svg>
      </BotonAccion>
      <BotonAccion
        titulo={`${activa ? "Desactivar" : "Activar"} ${singular}`}
        color="bg-amber-400"
        deshabilitado={sinCambiarEstado}
        onClick={onCambiarEstado}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
          <rect x="3" y="7" width="18" height="10" rx="5" />
          <circle cx={activa ? 16 : 8} cy="12" r="2.5" fill="currentColor" />
        </svg>
      </BotonAccion>
      <BotonAccion titulo={`Eliminar ${singular}`} color="bg-red-500" deshabilitado={sinEliminar} onClick={onEliminar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6m4-6v6" />
        </svg>
      </BotonAccion>
      {onCargar && (
        <BotonAccion titulo="Cargar archivo" color="bg-violet-500" onClick={onCargar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V4m0 0-4 4m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
        </BotonAccion>
      )}
    </div>
  );
}

// Mensaje verde o rojo con el resultado de la última acción.
export function Aviso({ estado }: { estado: Estado }) {
  if (!estado) return null;
  return (
    <p className={`rounded-lg px-3 py-2 text-sm ${estado.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {estado.mensaje}
    </p>
  );
}

// Ventana con un formulario; se cierra sola cuando la acción sale bien.
export function VentanaFormulario({
  titulo,
  textoBoton,
  accion,
  onCerrar,
  onGuardado,
  ancha,
  sinEnviar,
  children,
}: {
  titulo: string;
  textoBoton: string;
  accion: (estado: Estado, datos: FormData) => Promise<Estado>;
  onCerrar: () => void;
  onGuardado: (estado: Estado) => void;
  ancha?: boolean;
  sinEnviar?: boolean; // Deshabilita el botón de guardar
  children: ReactNode;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, null);

  useEffect(() => {
    if (estado?.ok) onGuardado(estado);
  }, [estado, onGuardado]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ventana"
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${ancha ? "max-w-4xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-ventana" className="mb-4 text-lg font-semibold">
          {titulo}
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const datos = new FormData(e.currentTarget);
            startTransition(() => enviar(datos));
          }}
        >
          {children}
          {estado && !estado.ok && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{estado.mensaje}</p>
          )}
          <div className="flex justify-end gap-2">
            <Boton type="button" variante="secundario" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton type="submit" disabled={pendiente || sinEnviar}>
              {pendiente ? "Guardando…" : textoBoton}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}

// Clases de una fila que se puede seleccionar.
export function claseFila(seleccionable: boolean, seleccionada: boolean) {
  return `${seleccionable ? "cursor-pointer select-none" : ""} ${seleccionada ? "bg-marca-100" : "hover:bg-crema-50"}`;
}

// La tabla se desplaza dentro de su recuadro (con su propia barra) y los
// títulos de las columnas quedan fijos arriba.
export const claseTablaDesplazable = "max-h-[calc(100dvh-19rem)] min-h-40 overflow-auto border-t border-slate-300";
export const claseEncabezadoFijo =
  "sticky top-0 z-10 bg-crema-50 text-xs uppercase text-slate-500 shadow-[inset_0_-1px_0_var(--color-slate-300)]";
