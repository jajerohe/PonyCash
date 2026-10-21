"use client";

import { useState } from "react";
import {
  Aviso,
  BarraAcciones,
  CabeceraListado,
  VentanaFormulario,
  claseFila,
  normalizar,
  useListado,
} from "@/components/listado";
import { Campo, Insignia, Selector } from "@/components/ui";
import { formatearFecha, formatearPesos, type Vigencia } from "@/lib/fechas";
import { cambiarEstadoTarifa, eliminarTarifa, guardarTarifa } from "./actions";
import { CargaTarifas } from "./carga-excel";

type Tarifa = {
  id: number;
  manillaId: number;
  manilla: string;
  tipoTarifaId: number;
  tipo: string;
  valor: number;
  desde: string;
  hasta: string;
  activa: boolean;
  predeterminada: boolean;
  vigencia: Vigencia;
};

type Opcion = { id: number; nombre: string; activa: boolean };

const insigniaVigencia = {
  vigente: <Insignia color="verde">Vigente</Insignia>,
  vencida: <Insignia color="rojo">Vencida</Insignia>,
  proxima: <Insignia color="marca">Próxima</Insignia>,
};

// Opciones activas más la que ya tenga la tarifa (aunque esté inactiva).
function opcionesPara(opciones: Opcion[], actualId?: number) {
  return opciones.filter((o) => o.activa || o.id === actualId);
}

export function ListadoTarifas({
  tarifas,
  manillas,
  tipos,
  puedeEditar,
}: {
  tarifas: Tarifa[];
  manillas: Opcion[];
  tipos: Opcion[];
  puedeEditar: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const { seleccionadaId, setSeleccionadaId, ventana, setVentana, aviso, setAviso, ocupado, ejecutar } = useListado();

  const filtro = normalizar(busqueda.trim());
  const visibles = tarifas.filter((t) => normalizar(`${t.manilla} ${t.tipo}`).includes(filtro));
  const seleccionada = tarifas.find((t) => t.id === seleccionadaId) ?? null;
  const sinEditar = !seleccionada || ocupado;
  // La predeterminada se puede editar, pero no desactivar ni eliminar.
  const sinOtras = sinEditar || !!seleccionada?.predeterminada;
  const editando = ventana === "editar" ? seleccionada : null;

  return (
    <div className="max-w-6xl space-y-6">
      <CabeceraListado
        titulo="Listado de Tarifas"
        buscar="Buscar tarifa"
        placeholder="Digite manilla o tipo de tarifa"
        busqueda={busqueda}
        onBuscar={setBusqueda}
        botones={
          puedeEditar && (
            <BarraAcciones
              singular="tarifa"
              activa={seleccionada?.activa !== false}
              sinEditar={sinEditar}
              sinCambiarEstado={sinOtras}
              sinEliminar={sinOtras}
              onCrear={() => setVentana("crear")}
              onEditar={() => setVentana("editar")}
              onCambiarEstado={() => seleccionada && ejecutar(() => cambiarEstadoTarifa(seleccionada.id))}
              onEliminar={() => {
                if (!seleccionada) return;
                const pregunta = `¿Eliminar la tarifa ${seleccionada.tipo} de "${seleccionada.manilla}"? No se puede deshacer.`;
                if (!window.confirm(pregunta)) return;
                ejecutar(() => eliminarTarifa(seleccionada.id), () => setSeleccionadaId(null));
              }}
              onCargar={() => setCargando(true)}
            />
          )
        }
      />

      <Aviso estado={aviso} />

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {puedeEditar && tarifas.length > 0 && (
          <p className="mb-3 text-xs text-slate-500">
            Haz clic en una fila para seleccionarla; doble clic para editarla.
            {seleccionada?.predeterminada &&
              " La tarifa predeterminada de la manilla solo permite cambiar el valor y las fechas."}
          </p>
        )}
        <table className="w-full text-left text-sm">
          <thead className="border-y border-slate-300 bg-crema-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Manilla</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Desde</th>
              <th className="px-4 py-3 font-medium">Hasta</th>
              <th className="px-4 py-3 font-medium">Vigencia</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibles.map((t) => {
              const activa = t.id === seleccionadaId;
              return (
                <tr
                  key={t.id}
                  aria-selected={activa}
                  onClick={() => puedeEditar && setSeleccionadaId(activa ? null : t.id)}
                  onDoubleClick={() => {
                    if (!puedeEditar) return;
                    setSeleccionadaId(t.id);
                    setVentana("editar");
                  }}
                  className={claseFila(puedeEditar, activa)}
                >
                  <td className="px-4 py-3 font-semibold">{t.manilla}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {t.tipo}
                    {t.predeterminada && (
                      <span className="ml-2 align-middle">
                        <Insignia color="marca">Predeterminada</Insignia>
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatearPesos(t.valor)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 tabular-nums">{formatearFecha(t.desde)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 tabular-nums">{formatearFecha(t.hasta)}</td>
                  <td className="px-4 py-3">{insigniaVigencia[t.vigencia]}</td>
                  <td className="px-4 py-3">
                    {t.activa ? <Insignia color="verde">Activo</Insignia> : <Insignia color="gris">Inactivo</Insignia>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            {tarifas.length === 0
              ? "Todavía no hay tarifas. Cada manilla nueva trae su tarifa Plena."
              : "Ninguna tarifa coincide con la búsqueda."}
          </p>
        )}
      </section>

      {cargando && (
        <CargaTarifas
          onCerrar={() => setCargando(false)}
          onCargado={(estado) => {
            setAviso(estado);
            setCargando(false);
          }}
        />
      )}

      {ventana && (
        <VentanaFormulario
          key={editando ? `editar-${editando.id}` : "crear"}
          titulo={editando ? "Editar tarifa" : "Nueva tarifa"}
          textoBoton={editando ? "Guardar cambios" : "Crear tarifa"}
          accion={guardarTarifa}
          onCerrar={() => setVentana(null)}
          onGuardado={(estado) => {
            setAviso(estado);
            setVentana(null);
          }}
        >
          <input type="hidden" name="id" value={editando?.id ?? 0} />
          {editando?.predeterminada ? (
            // En la predeterminada la manilla y el tipo no se cambian.
            <p className="rounded-lg bg-crema-50 px-3 py-2 text-sm text-slate-700">
              <span className="font-semibold">{editando.manilla}</span> · {editando.tipo} (predeterminada)
            </p>
          ) : (
            <>
              <Selector etiqueta="Manilla" name="manillaId" defaultValue={editando?.manillaId ?? ""} required>
                <option value="" disabled>
                  Elige una manilla
                </option>
                {opcionesPara(manillas, editando?.manillaId).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </Selector>
              <Selector etiqueta="Tipo de tarifa" name="tipoTarifaId" defaultValue={editando?.tipoTarifaId ?? ""} required>
                <option value="" disabled>
                  Elige un tipo
                </option>
                {opcionesPara(tipos, editando?.tipoTarifaId).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Selector>
            </>
          )}
          <Campo
            etiqueta="Valor (pesos)"
            name="valor"
            inputMode="numeric"
            placeholder="15000"
            defaultValue={editando?.valor ?? ""}
            required
            autoFocus={!!editando?.predeterminada}
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Desde" name="desde" type="date" defaultValue={editando?.desde} required />
            <Campo etiqueta="Hasta" name="hasta" type="date" defaultValue={editando?.hasta} required />
          </div>
        </VentanaFormulario>
      )}
    </div>
  );
}
