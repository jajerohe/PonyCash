"use client";

import { startTransition, useActionState, useEffect, useState, type ReactNode } from "react";
import { Boton, Campo, Insignia } from "@/components/ui";
import type { Estado } from "@/lib/errores";
import { cambiarEstadoManilla, eliminarManilla, guardarManilla } from "./actions";

type Manilla = { id: number; nombre: string; descripcion: string | null; activa: boolean };

// Quita tildes y mayúsculas para que "nino" encuentre "Niño".
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
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

// Ventana para crear o editar una manilla.
function VentanaManilla({
  manilla,
  onCerrar,
  onGuardada,
}: {
  manilla: Manilla | null;
  onCerrar: () => void;
  onGuardada: (estado: Estado) => void;
}) {
  const [estado, enviar, pendiente] = useActionState(guardarManilla, null);

  useEffect(() => {
    if (estado?.ok) onGuardada(estado);
  }, [estado, onGuardada]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ventana"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-ventana" className="mb-4 text-lg font-semibold">
          {manilla ? "Editar manilla" : "Nueva manilla"}
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const datos = new FormData(e.currentTarget);
            startTransition(() => enviar(datos));
          }}
        >
          <input type="hidden" name="id" value={manilla?.id ?? 0} />
          <Campo etiqueta="Nombre" name="nombre" defaultValue={manilla?.nombre} required autoFocus />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Descripción</span>
            <textarea
              name="descripcion"
              rows={3}
              defaultValue={manilla?.descripcion ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200"
            />
          </label>
          {estado && !estado.ok && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{estado.mensaje}</p>
          )}
          <div className="flex justify-end gap-2">
            <Boton type="button" variante="secundario" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton type="submit" disabled={pendiente}>
              {pendiente ? "Guardando…" : manilla ? "Guardar cambios" : "Crear manilla"}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ListadoManillas({ manillas, puedeEditar }: { manillas: Manilla[]; puedeEditar: boolean }) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [ventana, setVentana] = useState<"crear" | "editar" | null>(null);
  const [aviso, setAviso] = useState<Estado>(null);
  const [ocupado, setOcupado] = useState(false);

  const filtro = normalizar(busqueda.trim());
  const visibles = manillas.filter((m) => normalizar(`${m.nombre} ${m.descripcion ?? ""}`).includes(filtro));
  const seleccionada = manillas.find((m) => m.id === seleccionadaId) ?? null;

  function ejecutar(accion: () => Promise<Estado>, despues?: () => void) {
    setOcupado(true);
    startTransition(async () => {
      const resultado = await accion();
      setAviso(resultado);
      setOcupado(false);
      if (resultado?.ok) despues?.();
    });
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Listado de Manillas</h1>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="buscar-manilla">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-6 w-6" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path strokeLinecap="round" d="m15.5 15.5 5 5" />
            </svg>
            Buscar manilla
          </label>
        </div>

        {puedeEditar && (
          <div className="flex gap-3 rounded-xl bg-crema-100/70 px-4 py-3">
            <BotonAccion titulo="Crear manilla" color="bg-gradient-to-b from-lime-500 to-lime-700" onClick={() => setVentana("crear")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={icono} aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path strokeLinecap="round" d="M12 8v8M8 12h8" />
              </svg>
            </BotonAccion>
            <BotonAccion
              titulo="Editar manilla"
              color="bg-sky-500"
              deshabilitado={!seleccionada || ocupado}
              onClick={() => setVentana("editar")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4 20 1-4L16 5a2 2 0 0 1 3 3L8 19l-4 1Z" />
              </svg>
            </BotonAccion>
            <BotonAccion
              titulo={seleccionada?.activa === false ? "Activar manilla" : "Desactivar manilla"}
              color="bg-amber-400"
              deshabilitado={!seleccionada || ocupado}
              onClick={() => seleccionada && ejecutar(() => cambiarEstadoManilla(seleccionada.id))}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
                <rect x="3" y="7" width="18" height="10" rx="5" />
                <circle cx={seleccionada?.activa === false ? 8 : 16} cy="12" r="2.5" fill="currentColor" />
              </svg>
            </BotonAccion>
            <BotonAccion
              titulo="Eliminar manilla"
              color="bg-red-500"
              deshabilitado={!seleccionada || ocupado}
              onClick={() => {
                if (!seleccionada) return;
                if (!window.confirm(`¿Eliminar la manilla "${seleccionada.nombre}"? No se puede deshacer.`)) return;
                ejecutar(() => eliminarManilla(seleccionada.id), () => setSeleccionadaId(null));
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6m4-6v6" />
              </svg>
            </BotonAccion>
          </div>
        )}
      </div>

      <input
        id="buscar-manilla"
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Digite nombre o descripción"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200"
      />

      {aviso && (
        <p className={`rounded-lg px-3 py-2 text-sm ${aviso.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {aviso.mensaje}
        </p>
      )}

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {puedeEditar && manillas.length > 0 && (
          <p className="mb-3 text-xs text-slate-500">Haz clic en una manilla para seleccionarla; doble clic para editarla.</p>
        )}
        <table className="w-full text-left text-sm">
          <thead className="border-y border-slate-300 bg-crema-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Descripción</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibles.map((m) => {
              const activa = m.id === seleccionadaId;
              return (
                <tr
                  key={m.id}
                  aria-selected={activa}
                  onClick={() => puedeEditar && setSeleccionadaId(activa ? null : m.id)}
                  onDoubleClick={() => {
                    if (!puedeEditar) return;
                    setSeleccionadaId(m.id);
                    setVentana("editar");
                  }}
                  className={`${puedeEditar ? "cursor-pointer" : ""} ${activa ? "bg-marca-100" : "hover:bg-crema-50"}`}
                >
                  <td className="px-4 py-3 font-semibold">{m.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{m.descripcion}</td>
                  <td className="px-4 py-3">
                    {m.activa ? <Insignia color="verde">Activo</Insignia> : <Insignia color="gris">Inactivo</Insignia>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            {manillas.length === 0 ? "Todavía no hay manillas." : "Ninguna manilla coincide con la búsqueda."}
          </p>
        )}
      </section>

      {ventana && (
        <VentanaManilla
          key={ventana === "editar" ? `editar-${seleccionada?.id}` : "crear"}
          manilla={ventana === "editar" ? seleccionada : null}
          onCerrar={() => setVentana(null)}
          onGuardada={(estado) => {
            setAviso(estado);
            setVentana(null);
          }}
        />
      )}
    </div>
  );
}
