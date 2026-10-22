import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { movimiento, producto, puntoVenta } from "@/db/schema";
import { claseEncabezadoFijo } from "@/components/listado";
import { Insignia } from "@/components/ui";
import { esFechaValida, formatearFecha, formatearHora, hoy, sumarDias } from "@/lib/fechas";
import { existenciaAntesDe } from "@/lib/inventario";
import { requireSession } from "@/lib/session";

const tipos = {
  entrada: { texto: "Entrada", color: "verde" },
  entrega: { texto: "Entrega", color: "gris" },
  venta: { texto: "Cierre", color: "marca" },
  ajuste: { texto: "Ajuste", color: "rojo" },
} as const;

const claseCampo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-marca-500 focus:ring-2 focus:ring-marca-200";

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string; desde?: string; hasta?: string }>;
}) {
  await requireSession();
  const consulta = await searchParams;
  const db = getDb();
  const productos = await db.select({ id: producto.id, nombre: producto.nombre }).from(producto).orderBy(asc(producto.nombre));

  const productoId = Number(consulta.producto) || productos[0]?.id || 0;
  const hasta = esFechaValida(consulta.hasta ?? "") ? consulta.hasta! : hoy();
  const desde = esFechaValida(consulta.desde ?? "") && consulta.desde! <= hasta ? consulta.desde! : sumarDias(hasta, -6);

  const [saldoInicial, filas] = await Promise.all([
    existenciaAntesDe(db, productoId, desde),
    db
      .select({
        id: movimiento.id,
        fecha: movimiento.fecha,
        creado: movimiento.createdAt,
        tipo: movimiento.tipo,
        punto: puntoVenta.nombre,
        cantidad: movimiento.cantidad,
        cambio: movimiento.cambio,
        inicial: movimiento.inicial,
        quedaron: movimiento.quedaron,
        detalle: movimiento.detalle,
        usuario: movimiento.usuario,
      })
      .from(movimiento)
      .leftJoin(puntoVenta, eq(movimiento.puntoVentaId, puntoVenta.id))
      .where(and(eq(movimiento.productoId, productoId), gte(movimiento.fecha, desde), lte(movimiento.fecha, hasta)))
      .orderBy(asc(movimiento.fecha), asc(movimiento.id)),
  ]);

  // Existencia después de cada movimiento.
  const conSaldo = filas.reduce<((typeof filas)[number] & { existencia: number })[]>(
    (lista, f) => [...lista, { ...f, existencia: (lista.at(-1)?.existencia ?? saldoInicial) + f.cambio }],
    [],
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Movimientos</h1>
        <p className="mt-1 text-sm text-slate-500">Historia de un producto: entradas, entregas a los puntos, cierres y ajustes.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block w-64">
          <span className="mb-1 block text-sm font-medium text-slate-700">Producto</span>
          <select name="producto" defaultValue={productoId} className={claseCampo}>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
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

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <p className="font-semibold">¿Cómo se calcula?</p>
        <p className="mt-1">
          Si el inventario general tiene <b>20</b> manillas y la taquilla recibe <b>10</b>, el inventario sigue en 20 (10 en bodega y 10
          en la taquilla). Si al cierre quedaron <b>5</b>, se vendieron <b>10 − 5 = 5</b> y el inventario general queda en{" "}
          <b>20 − 5 = 15</b>. La taquilla empieza su siguiente jornada con esas 5.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-h-[calc(100dvh-14rem)] min-h-48 overflow-auto border-t border-slate-300">
          <table className="w-full text-left text-sm">
            <thead className={claseEncabezadoFijo}>
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Movimiento</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
                <th className="px-4 py-3 text-right font-medium">Recibió</th>
                <th className="px-4 py-3 text-right font-medium">Inicial</th>
                <th className="px-4 py-3 text-right font-medium">Quedaron</th>
                <th className="px-4 py-3 text-right font-medium">Vendidas</th>
                <th className="px-4 py-3 text-right font-medium">Cambio</th>
                <th className="px-4 py-3 text-right font-medium">Existencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-crema-50/60">
                <td className="px-4 py-2.5 text-slate-500">{formatearFecha(desde)}</td>
                <td className="px-4 py-2.5 font-semibold" colSpan={7}>
                  Saldo inicial
                </td>
                <td className="px-4 py-2.5 text-right font-bold tabular-nums">{saldoInicial}</td>
              </tr>
              {conSaldo.map((f) => (
                <tr key={f.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-slate-500">
                    {formatearFecha(f.fecha)} <span className="text-xs">{formatearHora(f.creado)}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Insignia color={tipos[f.tipo].color}>{tipos[f.tipo].texto}</Insignia>
                  </td>
                  <td className="px-4 py-2.5">
                    {[f.punto, f.detalle].filter(Boolean).join(" · ")}
                    <span className="block text-xs text-slate-400">{f.usuario}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sky-700">{f.tipo === "entrega" ? f.cantidad : ""}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{f.inicial ?? ""}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{f.quedaron ?? ""}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700">{f.tipo === "venta" ? f.cantidad : ""}</td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold tabular-nums ${
                      f.cambio > 0 ? "text-emerald-700" : f.cambio < 0 ? "text-red-600" : "text-slate-300"
                    }`}
                  >
                    {f.cambio > 0 ? `+${f.cambio}` : f.cambio < 0 ? `−${-f.cambio}` : "0"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{f.existencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {conSaldo.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No hay movimientos en esas fechas.</p>}
        <p className="mt-3 text-xs text-slate-500">
          Las entregas no cambian la existencia: solo la cambian los cierres (con las vendidas), las entradas y los ajustes.
        </p>
      </section>
    </div>
  );
}
