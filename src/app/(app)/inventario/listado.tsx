"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Aviso,
  VentanaFormulario,
  claseEncabezadoFijo,
  claseFila,
  claseTablaDesplazable,
  normalizar,
  useListado,
} from "@/components/listado";
import { Campo, Insignia, Resumen, Selector } from "@/components/ui";
import { ajustarProducto } from "./actions";

type Fila = { id: number; nombre: string; activa: boolean; minimo: number; existencia: number; enPuntos: number };
type Nivel = "agotado" | "bajo" | "normal";

function nivel(f: Fila): Nivel {
  if (f.existencia <= 0) return "agotado";
  if (f.existencia < f.minimo) return "bajo";
  return "normal";
}

const insignia: Record<Nivel, React.ReactNode> = {
  agotado: <Insignia color="rojo">Agotado</Insignia>,
  bajo: <Insignia color="marca">Bajo</Insignia>,
  normal: <Insignia color="verde">Normal</Insignia>,
};

const fmt = (n: number) => n.toLocaleString("es-CO");

export function ListadoInventario({ filas, puntos, puedeEditar }: { filas: Fila[]; puntos: number; puedeEditar: boolean }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroNivel, setFiltroNivel] = useState<"" | Nivel>("");
  const { seleccionadaId, setSeleccionadaId, ventana, setVentana, aviso, setAviso } = useListado();

  const filtro = normalizar(busqueda.trim());
  const visibles = filas.filter((f) => normalizar(f.nombre).includes(filtro) && (!filtroNivel || nivel(f) === filtroNivel));
  const seleccionada = filas.find((f) => f.id === seleccionadaId) ?? null;

  const total = filas.reduce((a, f) => a + f.existencia, 0);
  const enPuntos = filas.reduce((a, f) => a + f.enPuntos, 0);
  const bajos = filas.filter((f) => nivel(f) === "bajo").length;
  const agotados = filas.filter((f) => nivel(f) === "agotado").length;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventario general</h1>
          <p className="mt-1 text-sm text-slate-500">
            Todas las manillas del parque. La existencia solo baja con las vendidas que se registran al cerrar cada punto de venta.
          </p>
        </div>
        {puedeEditar && (
          <div className="flex gap-2">
            <Link
              href="/inventario/entrada"
              className="inline-flex items-center justify-center rounded-lg bg-marca-600 px-4 py-2 text-sm font-medium text-white hover:bg-marca-700"
            >
              Registrar entrada
            </Link>
            <button
              type="button"
              disabled={!seleccionada}
              onClick={() => setVentana("editar")}
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              Ajustar
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Resumen titulo="Existencia total" valor={fmt(total)} nota={`${filas.length} productos`} />
        <Resumen titulo="En puntos de venta" valor={fmt(enPuntos)} nota={`las que tienen ${puntos} punto(s) de venta`} color="text-sky-700" />
        <Resumen titulo="En bodega" valor={fmt(total - enPuntos)} nota="disponibles para entregar" />
        <Resumen
          titulo="Por reponer"
          valor={fmt(bajos + agotados)}
          nota={`${bajos} bajo el mínimo · ${agotados} agotado(s)`}
          color={bajos + agotados ? "text-red-600" : "text-slate-900"}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-60 flex-1">
          <span className="mb-1 block text-sm font-medium text-slate-700">Buscar</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Digite el nombre del producto"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200"
          />
        </label>
        <div className="w-44">
          <Selector etiqueta="Estado" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value as "" | Nivel)}>
            <option value="">Todos</option>
            <option value="normal">Normal</option>
            <option value="bajo">Bajo</option>
            <option value="agotado">Agotado</option>
          </Selector>
        </div>
      </div>

      <Aviso estado={aviso} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {puedeEditar && filas.length > 0 && (
          <p className="mb-3 text-xs text-slate-500">Haz clic en un producto para seleccionarlo; doble clic para ajustarlo.</p>
        )}
        <div className={claseTablaDesplazable}>
          <table className="w-full text-left text-sm">
            <thead className={claseEncabezadoFijo}>
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 text-right font-medium">Existencia</th>
                <th className="px-4 py-3 text-right font-medium">En puntos de venta</th>
                <th className="px-4 py-3 text-right font-medium">En bodega</th>
                <th className="px-4 py-3 text-right font-medium">Mínimo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((f) => {
                const activa = f.id === seleccionadaId;
                const bodega = f.existencia - f.enPuntos;
                return (
                  <tr
                    key={f.id}
                    aria-selected={activa}
                    onClick={() => puedeEditar && setSeleccionadaId(activa ? null : f.id)}
                    onDoubleClick={() => {
                      if (!puedeEditar) return;
                      setSeleccionadaId(f.id);
                      setVentana("editar");
                    }}
                    className={claseFila(puedeEditar, activa)}
                  >
                    <td className="px-4 py-3 font-semibold">
                      {f.nombre}
                      {!f.activa && <span className="ml-2 text-xs font-normal text-slate-400">(inactivo)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{fmt(f.existencia)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${f.enPuntos ? "text-sky-700" : "text-slate-300"}`}>
                      {f.enPuntos ? fmt(f.enPuntos) : "—"}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums ${bodega <= 0 ? "text-red-600" : ""}`}>{fmt(bodega)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">{fmt(f.minimo)}</td>
                    <td className="px-4 py-3">{insignia[nivel(f)]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibles.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            {filas.length === 0 ? "Todavía no hay productos. Créalos en Configuración → Productos." : "Ningún producto coincide con la búsqueda."}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          <b>En puntos de venta</b>: las que tienen las taquillas (lo que les quedó más lo que se les agregó).{" "}
          <b>En bodega</b> = Existencia − En puntos de venta.
        </p>
      </section>

      {ventana === "editar" && seleccionada && (
        <VentanaFormulario
          titulo={`Ajustar ${seleccionada.nombre}`}
          textoBoton="Guardar"
          accion={ajustarProducto}
          onCerrar={() => setVentana(null)}
          onGuardado={(estado) => {
            setVentana(null);
            setAviso(estado);
          }}
        >
          <input type="hidden" name="productoId" value={seleccionada.id} />
          <p className="rounded-lg bg-crema-50 px-3 py-2 text-sm text-slate-600">
            Existencia actual: <b>{fmt(seleccionada.existencia)}</b> · en puntos de venta: <b>{fmt(seleccionada.enPuntos)}</b>
          </p>
          <Campo etiqueta="Existencia" name="existencia" inputMode="numeric" defaultValue={seleccionada.existencia} required />
          <Campo etiqueta="Motivo del ajuste (si cambia la existencia)" name="motivo" placeholder="Ej.: conteo de bodega, manillas dañadas" />
          <Campo etiqueta="Mínimo" name="minimo" inputMode="numeric" defaultValue={seleccionada.minimo} required />
        </VentanaFormulario>
      )}
    </div>
  );
}
