"use client";

// Listado de nombre + descripción (manillas, tipos de tarifa…): buscador, tabla
// Nombre/Descripción/Estado y botones para crear, editar, activar y eliminar.
import { useState } from "react";
import {
  Aviso,
  BarraAcciones,
  CabeceraListado,
  VentanaFormulario,
  claseEncabezadoFijo,
  claseFila,
  claseTablaDesplazable,
  normalizar,
  useListado,
} from "@/components/listado";
import { Campo, Insignia } from "@/components/ui";
import type { Estado } from "@/lib/errores";

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
  alEliminar?: string; // Aviso extra al confirmar la eliminación
};

type Acciones = {
  guardar: (estado: Estado, datos: FormData) => Promise<Estado>;
  cambiarEstado: (id: number) => Promise<Estado>;
  eliminar: (id: number) => Promise<Estado>;
};

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
  const { seleccionadaId, setSeleccionadaId, ventana, setVentana, aviso, setAviso, ocupado, ejecutar } = useListado();

  const filtro = normalizar(busqueda.trim());
  const visibles = elementos.filter((m) => normalizar(`${m.nombre} ${m.descripcion ?? ""}`).includes(filtro));
  const seleccionada = elementos.find((m) => m.id === seleccionadaId) ?? null;
  // Editar, activar y eliminar solo aplican a uno seleccionado que no esté protegido.
  const sinAccion = !seleccionada || !!seleccionada.protegido || ocupado;
  const editando = ventana === "editar" ? seleccionada : null;

  return (
    <div className="max-w-5xl space-y-6">
      <CabeceraListado
        titulo={textos.titulo}
        buscar={textos.buscar}
        placeholder="Digite nombre o descripción"
        busqueda={busqueda}
        onBuscar={setBusqueda}
        botones={
          puedeEditar && (
            <BarraAcciones
              singular={textos.singular}
              activa={seleccionada?.activa !== false}
              sinEditar={sinAccion}
              sinCambiarEstado={sinAccion}
              sinEliminar={sinAccion}
              onCrear={() => setVentana("crear")}
              onEditar={() => setVentana("editar")}
              onCambiarEstado={() => seleccionada && ejecutar(() => acciones.cambiarEstado(seleccionada.id))}
              onEliminar={() => {
                if (!seleccionada) return;
                const pregunta = `¿Eliminar ${textos.singular} "${seleccionada.nombre}"? ${textos.alEliminar ?? ""}No se puede deshacer.`;
                if (!window.confirm(pregunta)) return;
                ejecutar(() => acciones.eliminar(seleccionada.id), () => setSeleccionadaId(null));
              }}
            />
          )
        }
      />

      <Aviso estado={aviso} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {puedeEditar && elementos.length > 0 && (
          <p className="mb-3 text-xs text-slate-500">
            Haz clic en una fila para seleccionarla; doble clic para editarla.
            {seleccionada?.protegido && " Este registro viene con el sistema y no se puede modificar."}
          </p>
        )}
        <div className={claseTablaDesplazable}>
          <table className="w-full text-left text-sm">
            <thead className={claseEncabezadoFijo}>
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
                    className={claseFila(puedeEditar, activa)}
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
        </div>
        {visibles.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            {elementos.length === 0 ? `Todavía no hay ${textos.plural}.` : "Ningún registro coincide con la búsqueda."}
          </p>
        )}
      </section>

      {ventana && (
        <VentanaFormulario
          key={editando ? `editar-${editando.id}` : "crear"}
          titulo={editando ? `Editar ${textos.singular}` : textos.nuevo}
          textoBoton={editando ? "Guardar cambios" : `Crear ${textos.singular}`}
          accion={acciones.guardar}
          onCerrar={() => setVentana(null)}
          onGuardado={(estado) => {
            setAviso(estado);
            setVentana(null);
          }}
        >
          <input type="hidden" name="id" value={editando?.id ?? 0} />
          <Campo etiqueta="Nombre" name="nombre" defaultValue={editando?.nombre} required autoFocus />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Descripción</span>
            <textarea
              name="descripcion"
              rows={3}
              defaultValue={editando?.descripcion ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200"
            />
          </label>
        </VentanaFormulario>
      )}
    </div>
  );
}
