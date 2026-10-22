import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { movimiento, producto, puntoVenta } from "@/db/schema";
import { claseEncabezadoFijo } from "@/components/listado";
import { Resumen } from "@/components/ui";
import { esFechaValida, formatearFecha, hoy } from "@/lib/fechas";
import { requireSession } from "@/lib/session";

const claseCampo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200";
const fmt = (n: number) => n.toLocaleString("es-CO");

export default async function ReporteVentasPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  await requireSession();
  const consulta = await searchParams;
  const hasta = esFechaValida(consulta.hasta ?? "") ? consulta.hasta! : hoy();
  const desde = esFechaValida(consulta.desde ?? "") && consulta.desde! <= hasta ? consulta.desde! : `${hasta.slice(0, 7)}-01`;

  const db = getDb();
  const entreFechas = and(eq(movimiento.tipo, "venta"), gte(movimiento.fecha, desde), lte(movimiento.fecha, hasta));
  const [ventas, porDia] = await Promise.all([
    db
      .select({
        productoId: movimiento.productoId,
        producto: producto.nombre,
        puntoId: movimiento.puntoVentaId,
        punto: puntoVenta.nombre,
        vendidas: sql<number>`sum(${movimiento.cantidad})::int`,
      })
      .from(movimiento)
      .innerJoin(producto, eq(movimiento.productoId, producto.id))
      .leftJoin(puntoVenta, eq(movimiento.puntoVentaId, puntoVenta.id))
      .where(entreFechas)
      .groupBy(movimiento.productoId, producto.nombre, movimiento.puntoVentaId, puntoVenta.nombre)
      .orderBy(asc(producto.nombre)),
    db
      .select({ fecha: movimiento.fecha, vendidas: sql<number>`sum(${movimiento.cantidad})::int` })
      .from(movimiento)
      .where(entreFechas)
      .groupBy(movimiento.fecha),
  ]);

  // Columnas: los puntos que vendieron en el período.
  const puntos = [...new Map(ventas.map((v) => [v.puntoId, v.punto ?? "—"])).entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  const productos = [...new Map(ventas.map((v) => [v.productoId, v.producto])).entries()];
  const celda = new Map(ventas.map((v) => [`${v.productoId}-${v.puntoId}`, v.vendidas]));
  const totalProducto = (id: number) => puntos.reduce((a, [p]) => a + (celda.get(`${id}-${p}`) ?? 0), 0);
  const totalPunto = (id: number | null) => productos.reduce((a, [p]) => a + (celda.get(`${p}-${id}`) ?? 0), 0);
  const total = ventas.reduce((a, v) => a + v.vendidas, 0);

  const dias = Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000) + 1;
  const masVendido = productos.map(([id, nombre]) => ({ nombre, v: totalProducto(id) })).sort((a, b) => b.v - a.v)[0];
  const mejorDia = [...porDia].sort((a, b) => b.vendidas - a.vendidas)[0];

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reporte de ventas</h1>
        <p className="mt-1 text-sm text-slate-500">Manillas vendidas (Inicial − Final de cada cierre) por producto y punto de venta.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block w-44">
          <span className="mb-1 block text-sm font-medium text-slate-700">Desde</span>
          <input type="date" name="desde" defaultValue={desde} className={claseCampo} />
        </label>
        <label className="block w-44">
          <span className="mb-1 block text-sm font-medium text-slate-700">Hasta</span>
          <input type="date" name="hasta" defaultValue={hasta} className={claseCampo} />
        </label>
        <button className="rounded-lg bg-marca-600 px-4 py-2 text-sm font-medium text-white hover:bg-marca-700">Ver</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Resumen titulo="Vendidas en el período" valor={fmt(total)} nota={`${dias} día(s)`} />
        <Resumen titulo="Promedio por día" valor={fmt(Math.round(total / dias))} nota="manillas" />
        <Resumen titulo="Más vendido" valor={masVendido?.nombre ?? "—"} nota={masVendido ? `${fmt(masVendido.v)} manillas` : undefined} color="text-marca-700" />
        <Resumen titulo="Mejor día" valor={mejorDia ? formatearFecha(mejorDia.fecha) : "—"} nota={mejorDia ? `${fmt(mejorDia.vendidas)} manillas` : undefined} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-auto border-t border-slate-300">
          <table className="w-full text-left text-sm">
            <thead className={claseEncabezadoFijo}>
              <tr>
                <th className="px-4 py-3 font-medium">Concepto</th>
                {puntos.map(([id, nombre]) => (
                  <th key={id ?? 0} className="px-4 py-3 text-right font-medium">
                    {nombre}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map(([id, nombre]) => (
                <tr key={id}>
                  <td className="px-4 py-2.5 font-semibold">{nombre}</td>
                  {puntos.map(([p]) => {
                    const n = celda.get(`${id}-${p}`) ?? 0;
                    return (
                      <td key={p ?? 0} className={`px-4 py-2.5 text-right tabular-nums ${n ? "" : "text-slate-300"}`}>
                        {fmt(n)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{fmt(totalProducto(id))}</td>
                </tr>
              ))}
              {productos.length > 0 && (
                <tr className="bg-crema-50 font-bold">
                  <td className="px-4 py-2.5">TOTAL MANILLAS</td>
                  {puntos.map(([p]) => (
                    <td key={p ?? 0} className="px-4 py-2.5 text-right tabular-nums">
                      {fmt(totalPunto(p))}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(total)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {productos.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No hay ventas cerradas en esas fechas.</p>}
      </section>
    </div>
  );
}
