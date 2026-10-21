"use client";

// Elegir un punto de venta (izquierda) y marcar los productos que puede vender (derecha).
import { useMemo, useState, useTransition } from "react";
import { Aviso } from "@/components/listado";
import { Boton, Insignia } from "@/components/ui";
import type { Estado } from "@/lib/errores";
import { normalizar } from "@/lib/texto";
import { guardarProductosDelPunto } from "./actions";

type Punto = { id: number; nombre: string; descripcion: string | null; activa: boolean };
type Producto = { id: number; nombre: string; activa: boolean };
type Asignacion = { puntoVentaId: number; productoId: number };

const claseBuscador =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200";

export function ProductosPorPunto({
  puntos,
  productos,
  asignaciones,
  puedeEditar,
}: {
  puntos: Punto[];
  productos: Producto[];
  asignaciones: Asignacion[];
  puedeEditar: boolean;
}) {
  const [puntoId, setPuntoId] = useState<number | null>(puntos[0]?.id ?? null);
  // Marcas sin guardar del punto elegido; null = las guardadas.
  const [borrador, setBorrador] = useState<Set<number> | null>(null);
  const [buscarPunto, setBuscarPunto] = useState("");
  const [buscarProducto, setBuscarProducto] = useState("");
  const [aviso, setAviso] = useState<Estado>(null);
  const [guardando, iniciar] = useTransition();

  // Productos guardados de cada punto de venta.
  const porPunto = useMemo(() => {
    const mapa = new Map<number, Set<number>>();
    for (const a of asignaciones) {
      if (!mapa.has(a.puntoVentaId)) mapa.set(a.puntoVentaId, new Set());
      mapa.get(a.puntoVentaId)!.add(a.productoId);
    }
    return mapa;
  }, [asignaciones]);

  const activas = productos.filter((m) => m.activa);
  const cuenta = (marcadas: Set<number> | undefined) => activas.filter((m) => marcadas?.has(m.id)).length;

  const punto = puntos.find((p) => p.id === puntoId) ?? null;
  const guardadas = (punto && porPunto.get(punto.id)) || new Set<number>();
  const marcadas = borrador ?? guardadas;
  const hayCambios = borrador !== null && activas.some((m) => borrador.has(m.id) !== guardadas.has(m.id));

  const puntosVisibles = puntos.filter((p) => normalizar(p.nombre).includes(normalizar(buscarPunto.trim())));
  const productosVisibles = productos.filter((m) => normalizar(m.nombre).includes(normalizar(buscarProducto.trim())));

  function elegirPunto(id: number) {
    if (id === puntoId) return;
    if (hayCambios && !window.confirm("Tienes cambios sin guardar en este punto de venta. ¿Descartarlos?")) return;
    setPuntoId(id);
    setBorrador(null);
    setAviso(null);
  }

  function cambiar(ids: number[], marcar: boolean) {
    const nuevo = new Set(marcadas);
    for (const id of ids) {
      if (marcar) nuevo.add(id);
      else nuevo.delete(id);
    }
    setBorrador(nuevo);
  }

  function guardar() {
    if (!punto) return;
    iniciar(async () => {
      const resultado = await guardarProductosDelPunto(punto.id, [...marcadas]);
      setAviso(resultado);
      if (resultado?.ok) setBorrador(null);
    });
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Productos por Punto de Venta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Elige un punto de venta y marca los productos que se pueden vender allí.
        </p>
      </div>

      <Aviso estado={aviso} />

      {puntos.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Todavía no hay puntos de venta. Créalos en Configuración → Puntos de Venta.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 px-2 text-xs font-medium uppercase text-slate-500">Puntos de venta</h2>
            <input
              type="search"
              value={buscarPunto}
              onChange={(e) => setBuscarPunto(e.target.value)}
              placeholder="Buscar punto de venta"
              aria-label="Buscar punto de venta"
              className={`mb-3 ${claseBuscador}`}
            />
            <ul className="max-h-[calc(100dvh-20rem)] min-h-40 space-y-1 overflow-auto text-sm">
              {puntosVisibles.map((p) => {
                const elegido = p.id === puntoId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => elegirPunto(p.id)}
                      aria-current={elegido}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-left ${
                        elegido ? "bg-marca-100 font-semibold text-marca-800" : "hover:bg-crema-50"
                      }`}
                    >
                      <span className={p.activa ? "" : "text-slate-400"}>
                        {p.nombre}
                        {!p.activa && <span className="ml-1 text-xs">(inactivo)</span>}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
                          elegido ? "bg-white text-marca-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {cuenta(elegido ? marcadas : porPunto.get(p.id))} de {activas.length}
                      </span>
                    </button>
                  </li>
                );
              })}
              {puntosVisibles.length === 0 && (
                <li className="px-3 py-6 text-center text-slate-500">Ningún punto coincide.</li>
              )}
            </ul>
          </section>

          {punto && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{punto.nombre}</h2>
                  <p className="text-sm text-slate-500">
                    {punto.descripcion && `${punto.descripcion} · `}vende{" "}
                    <b className="text-slate-700">
                      {cuenta(marcadas)} de {activas.length}
                    </b>{" "}
                    productos
                  </p>
                </div>
                {puedeEditar && (
                  <div className="flex gap-2">
                    <Boton
                      type="button"
                      variante="secundario"
                      onClick={() => cambiar(activas.map((m) => m.id), true)}
                    >
                      Marcar todas
                    </Boton>
                    <Boton
                      type="button"
                      variante="secundario"
                      onClick={() => cambiar(activas.map((m) => m.id), false)}
                    >
                      Quitar todas
                    </Boton>
                  </div>
                )}
              </div>

              <input
                type="search"
                value={buscarProducto}
                onChange={(e) => setBuscarProducto(e.target.value)}
                placeholder="Buscar producto"
                aria-label="Buscar producto"
                className={`mb-3 ${claseBuscador}`}
              />

              <div className="max-h-[calc(100dvh-26rem)] min-h-40 overflow-auto rounded-lg border border-slate-200 text-sm">
                <div className="sticky top-0 z-10 bg-crema-50 px-4 py-2 text-xs uppercase text-slate-500">Producto</div>
                {productosVisibles.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 ${
                      m.activa && puedeEditar ? "cursor-pointer hover:bg-crema-50" : "text-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="producto"
                      value={m.id}
                      checked={marcadas.has(m.id)}
                      disabled={!m.activa || !puedeEditar}
                      onChange={(e) => cambiar([m.id], e.target.checked)}
                      className="h-5 w-5 accent-marca-600"
                    />
                    <span className="flex-1 font-medium">{m.nombre}</span>
                    {!m.activa && <Insignia color="gris">Inactiva</Insignia>}
                  </label>
                ))}
                {productos.length === 0 && (
                  <p className="px-4 py-6 text-center text-slate-500">Todavía no hay productos.</p>
                )}
                {productos.length > 0 && productosVisibles.length === 0 && (
                  <p className="px-4 py-6 text-center text-slate-500">Ningun producto coincide.</p>
                )}
              </div>

              {puedeEditar && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {hayCambios ? "Tienes cambios sin guardar." : "Los productos inactivos no se pueden marcar."}
                  </p>
                  <div className="flex gap-2">
                    <Boton
                      type="button"
                      variante="secundario"
                      disabled={!hayCambios || guardando}
                      onClick={() => setBorrador(null)}
                    >
                      Cancelar
                    </Boton>
                    <Boton type="button" disabled={!hayCambios || guardando} onClick={guardar}>
                      {guardando ? "Guardando…" : "Guardar cambios"}
                    </Boton>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
