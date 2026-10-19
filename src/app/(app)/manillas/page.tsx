import Link from "next/link";
import { and, asc, desc, eq, gte, lte, sum } from "drizzle-orm";
import { Formulario } from "@/components/formulario";
import { Campo, Selector, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { categoriaManilla, user, ventaManilla } from "@/db/schema";
import { esFechaValida, formatearFecha, hoy } from "@/lib/fechas";
import { requireSession } from "@/lib/session";
import { eliminarVenta, registrarVenta } from "./actions";

export default async function ManillasPage({ searchParams }: PageProps<"/manillas">) {
  const { user: yo } = await requireSession();
  const esAdmin = yo.role === "admin";
  const params = await searchParams;

  // Rango de fechas del resumen: por defecto, solo hoy.
  const fechaHoy = hoy();
  const desde = typeof params.desde === "string" && esFechaValida(params.desde) ? params.desde : fechaHoy;
  const hasta = typeof params.hasta === "string" && esFechaValida(params.hasta) ? params.hasta : desde;
  const enRango = and(gte(ventaManilla.fecha, desde), lte(ventaManilla.fecha, hasta));

  const db = getDb();
  const [categorias, totales, registros] = await Promise.all([
    db.select().from(categoriaManilla).orderBy(asc(categoriaManilla.nombre)),
    db
      .select({ categoriaId: ventaManilla.categoriaId, total: sum(ventaManilla.cantidad) })
      .from(ventaManilla)
      .where(enRango)
      .groupBy(ventaManilla.categoriaId),
    db
      .select({
        id: ventaManilla.id,
        cantidad: ventaManilla.cantidad,
        fecha: ventaManilla.fecha,
        creado: ventaManilla.createdAt,
        categoria: categoriaManilla.nombre,
        color: categoriaManilla.color,
        usuario: user.name,
      })
      .from(ventaManilla)
      .innerJoin(categoriaManilla, eq(ventaManilla.categoriaId, categoriaManilla.id))
      .leftJoin(user, eq(ventaManilla.usuarioId, user.id))
      .where(enRango)
      .orderBy(desc(ventaManilla.fecha), desc(ventaManilla.createdAt))
      .limit(200),
  ]);

  const totalPorCategoria = new Map(totales.map((t) => [t.categoriaId, Number(t.total)]));
  // Se muestran las categorías activas y las inactivas que tuvieron ventas en el rango.
  const resumen = categorias
    .map((c) => ({ ...c, total: totalPorCategoria.get(c.id) ?? 0 }))
    .filter((c) => c.activa || c.total > 0);
  const totalGeneral = resumen.reduce((suma, c) => suma + c.total, 0);
  const activas = categorias.filter((c) => c.activa);
  const textoRango =
    desde === hasta ? formatearFecha(desde) : `${formatearFecha(desde)} al ${formatearFecha(hasta)}`;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manillas</h1>
          <p className="text-sm text-slate-500">Manillas vendidas por categoría</p>
        </div>
        {esAdmin && (
          <Link
            href="/manillas/categorias"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Categorías
          </Link>
        )}
      </div>

      <Tarjeta>
        <h2 className="mb-4 font-semibold">Registrar venta</h2>
        {activas.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no hay categorías activas.{" "}
            {esAdmin ? (
              <Link href="/manillas/categorias" className="text-violet-600 hover:underline">
                Crea la primera
              </Link>
            ) : (
              "Pídele a un administrador que las cree."
            )}
          </p>
        ) : (
          <Formulario
            accion={registrarVenta}
            textoBoton="Registrar"
            limpiarAlGuardar
            className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr] sm:items-start sm:[&>p]:col-span-3 sm:[&>button]:w-fit"
          >
            <Selector etiqueta="Categoría" name="categoriaId" required defaultValue="">
              <option value="" disabled>
                Elige una categoría
              </option>
              {activas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Selector>
            <Campo etiqueta="Cantidad" name="cantidad" type="number" min={1} step={1} required />
            <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={fechaHoy} max={fechaHoy} required />
          </Formulario>
        )}
      </Tarjeta>

      <Tarjeta>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Resumen</h2>
            <p className="text-sm text-slate-500">{textoRango}</p>
          </div>
          <form className="flex flex-wrap items-end gap-2">
            <Campo etiqueta="Desde" name="desde" type="date" defaultValue={desde} />
            <Campo etiqueta="Hasta" name="hasta" type="date" defaultValue={hasta} />
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
              Ver
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="col-span-2 rounded-xl bg-violet-600 p-4 text-white lg:col-span-1">
            <p className="text-sm opacity-80">Total vendidas</p>
            <p className="text-3xl font-bold">{totalGeneral.toLocaleString("es-CO")}</p>
          </div>
          {resumen.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                {c.nombre}
              </p>
              <p className="text-3xl font-bold">{c.total.toLocaleString("es-CO")}</p>
            </div>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta className="overflow-x-auto p-0">
        <h2 className="px-6 pt-6 font-semibold">Registros</h2>
        {registros.length === 0 ? (
          <p className="px-6 pb-6 pt-2 text-sm text-slate-500">No hay ventas registradas en estas fechas.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Fecha</th>
                <th className="px-6 py-3 font-medium">Categoría</th>
                <th className="px-6 py-3 text-right font-medium">Cantidad</th>
                <th className="px-6 py-3 font-medium">Registrado por</th>
                {esAdmin && <th className="px-6 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">{formatearFecha(r.fecha)}</td>
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
                      {r.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium">{r.cantidad}</td>
                  <td className="px-6 py-3 text-slate-500">{r.usuario ?? "—"}</td>
                  {esAdmin && (
                    <td className="px-6 py-3 text-right">
                      <Formulario
                        accion={eliminarVenta}
                        textoBoton="Eliminar"
                        variante="secundario"
                        confirmar={`¿Eliminar el registro de ${r.cantidad} manilla(s) ${r.categoria}?`}
                        className="flex flex-col items-end gap-1"
                      >
                        <input type="hidden" name="id" value={r.id} />
                      </Formulario>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>
    </div>
  );
}
