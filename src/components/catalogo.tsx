"use client";

import { startTransition, useActionState, useEffect, useState, type ReactNode } from "react";
import { Boton, Campo, Insignia } from "@/components/ui";
import type { Estado } from "@/lib/errores";
// Listado genérico (manillas, tipos de tarifa…): buscador, tabla
// Nombre/Descripción/Estado y botones para crear, editar, activar y eliminar.

export type Elemento = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  // Los protegidos vienen con el sistema: no se editan, desactivan ni eliminan.
  protegido?: boolean;
};

export type TextosCatalogo = {
  titulo: string; // "Listado de Manillas"
  buscar: string; // "Buscar manilla"
  singular: string; // "manilla"
  plural: string; // "manillas"
  nuevo: string; // "Nueva manilla"
};

type Acciones = {
  guardar: (estado: Estado, datos: FormData) => Promise<Estado>;
  cambiarEstado: (id: number) => Promise<Estado>;
  eliminar: (id: number) => Promise<Estado>;
};

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

// Ventana para crear o editar un elemento.
function Ventana({
  elemento,
  textos,
  guardar,
  onCerrar,
  onGuardado,
}: {
  elemento: Elemento | null;
  textos: TextosCatalogo;
  guardar: Acciones["guardar"];
  onCerrar: () => void;
  onGuardado: (estado: Estado) => void;
}) {
  const [estado, enviar, pendiente] = useActionState(guardar, null);

  useEffect(() => {
    if (estado?.ok) onGuardado(estado);
  }, [estado, onGuardado]);

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
          {elemento ? `Editar ${textos.singular}` : textos.nuevo}
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const datos = new FormData(e.currentTarget);
            startTransition(() => enviar(datos));
          }}
        >
          <input type="hidden" name="id" value={elemento?.id ?? 0} />
          <Campo etiqueta="Nombre" name="nombre" defaultValue={elemento?.nombre} required autoFocus />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Descripción</span>
            <textarea
              name="descripcion"
              rows={3}
              defaultValue={elemento?.descripcion ?? ""}
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
              {pendiente ? "Guardando…" : elemento ? "Guardar cambios" : `Crear ${textos.singular}`}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Catalogo({
  elementos,
  puedeEditar,
  textos,
  acciones,
}: {
  elementos: Elemento[];
  puedeEditar: boolean;
  textos: TextosCatalogo;
  acciones: Acciones;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [ventana, setVentana] = useState<"crear" | "editar" | null>(null);
  const [aviso, setAviso] = useState<Estado>(null);
  const [ocupado, setOcupado] = useState(false);

  const filtro = normalizar(busqueda.trim());
  const visibles = elementos.filter((m) => normalizar(`${m.nombre} ${m.descripcion ?? ""}`).includes(filtro));
  const seleccionada = elementos.find((m) => m.id === seleccionadaId) ?? null;
  // Editar, activar y eliminar solo aplican a uno seleccionado que no esté protegido.
  const sinAccion = !seleccionada || seleccionada.protegido || ocupado;

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
          <h1 className="text-2xl font-bold">{textos.titulo}</h1>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-6 w-6" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path strokeLinecap="round" d="m15.5 15.5 5 5" />
            </svg>
            {textos.buscar}
          </label>
        </div>

        {puedeEditar && (
          <div className="flex gap-3 rounded-xl bg-crema-100/70 px-4 py-3">
            <BotonAccion titulo={`Crear ${textos.singular}`} color="bg-gradient-to-b from-lime-500 to-lime-700" onClick={() => setVentana("crear")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={icono} aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path strokeLinecap="round" d="M12 8v8M8 12h8" />
              </svg>
            </BotonAccion>
            <BotonAccion
              titulo={`Editar ${textos.singular}`}
              color="bg-sky-500"
              deshabilitado={sinAccion}
              onClick={() => setVentana("editar")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4 20 1-4L16 5a2 2 0 0 1 3 3L8 19l-4 1Z" />
              </svg>
            </BotonAccion>
            <BotonAccion
              titulo={`${seleccionada?.activa === false ? "Activar" : "Desactivar"} ${textos.singular}`}
              color="bg-amber-400"
              deshabilitado={sinAccion}
              onClick={() => seleccionada && ejecutar(() => acciones.cambiarEstado(seleccionada.id))}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={icono} aria-hidden="true">
                <rect x="3" y="7" width="18" height="10" rx="5" />
                <circle cx={seleccionada?.activa === false ? 8 : 16} cy="12" r="2.5" fill="currentColor" />
              </svg>
            </BotonAccion>
            <BotonAccion
              titulo={`Eliminar ${textos.singular}`}
              color="bg-red-500"
              deshabilitado={sinAccion}
              onClick={() => {
                if (!seleccionada) return;
                if (!window.confirm(`¿Eliminar ${textos.singular} "${seleccionada.nombre}"? No se puede deshacer.`)) return;
                ejecutar(() => acciones.eliminar(seleccionada.id), () => setSeleccionadaId(null));
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
        id="buscar"
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
        {puedeEditar && elementos.length > 0 && (
          <p className="mb-3 text-xs text-slate-500">
            Haz clic en una fila para seleccionarla; doble clic para editarla.
            {seleccionada?.protegido && " Este registro viene con el sistema y no se puede modificar."}
          </p>
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
                    if (!m.protegido) setVentana("editar");
                  }}
                  className={`${puedeEditar ? "cursor-pointer select-none" : ""} ${activa ? "bg-marca-100" : "hover:bg-crema-50"}`}
                >
                  <td className="px-4 py-3 font-semibold">
                    {m.nombre}
                    {m.protegido && (
                      <span className="ml-2 align-middle">
                        <Insignia color="marca">Predeterminada</Insignia>
                      </span>
                    )}
                  </td>
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
            {elementos.length === 0 ? `Todavía no hay ${textos.plural}.` : "Ningún registro coincide con la búsqueda."}
          </p>
        )}
      </section>

      {ventana && (
        <Ventana
          key={ventana === "editar" ? `editar-${seleccionada?.id}` : "crear"}
          elemento={ventana === "editar" ? seleccionada : null}
          textos={textos}
          guardar={acciones.guardar}
          onCerrar={() => setVentana(null)}
          onGuardado={(estado) => {
            setAviso(estado);
            setVentana(null);
          }}
        />
      )}
    </div>
  );
}
