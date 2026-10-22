import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { puntoVenta } from "@/db/schema";
import { Insignia } from "@/components/ui";
import { claseEncabezadoFijo } from "@/components/listado";
import { esFechaValida, formatearFecha, formatearHora, hoy } from "@/lib/fechas";
import { estadoJornada, type EstadoJornada } from "@/lib/inventario";
import { requireSession } from "@/lib/session";
import { ElegirFecha } from "./elegir-fecha";

type Totales = { anterior: number; recibidas: number; inicial: number; final: number | null };

function totales(estado: EstadoJornada): Totales | null {
  if (estado.tipo !== "existe" && estado.tipo !== "nueva") return null;
  const anterior = estado.filas.reduce((a, f) => a + f.anterior, 0);
  const recibidas = estado.filas.reduce((a, f) => a + f.recibidas, 0);
  const cerrada = estado.tipo === "existe" && estado.cerrada;
  return {
    anterior,
    recibidas,
    inicial: anterior + recibidas,
    final: cerrada ? estado.filas.reduce((a, f) => a + (f.final ?? 0), 0) : null,
  };
}

const fmt = (n: number) => n.toLocaleString("es-CO");
const boton = "inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium";

function Cifra({ titulo, valor, color = "" }: { titulo: string; valor: number | null; color?: string }) {
  return (
    <div className="rounded-xl bg-crema-50 px-2 py-2 text-center">
      <p className="text-[10px] font-medium uppercase text-slate-500">{titulo}</p>
      <p className={`text-lg font-bold tabular-nums ${valor === null ? "text-slate-300" : color}`}>{valor === null ? "—" : fmt(valor)}</p>
    </div>
  );
}

export default async function JornadaPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  await requireSession();
  const pedida = (await searchParams).fecha ?? "";
  const fecha = esFechaValida(pedida) && pedida <= hoy() ? pedida : hoy();

  const db = getDb();
  const puntos = await db
    .select({ id: puntoVenta.id, nombre: puntoVenta.nombre })
    .from(puntoVenta)
    .where(eq(puntoVenta.activa, true))
    .orderBy(asc(puntoVenta.nombre));
  const jornadas = await Promise.all(puntos.map(async (p) => ({ ...p, estado: await estadoJornada(db, p.id, fecha) })));

  const suma = (k: keyof Totales) =>
    jornadas.reduce((a, j) => {
      const t = totales(j.estado);
      return a + (t?.[k] ?? 0);
    }, 0);
  const cerradas = jornadas.filter((j) => j.estado.tipo === "existe" && j.estado.cerrada);
  const vendidas = cerradas.reduce((a, j) => {
    const t = totales(j.estado)!;
    return a + t.inicial - (t.final ?? 0);
  }, 0);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Jornada diaria</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cada punto empieza con lo que le quedó en su jornada anterior, puede recibir más manillas y al cerrar se cuenta lo que
            quedó. Vendidas = Inicial − Quedaron.
          </p>
        </div>
        <ElegirFecha fecha={fecha} maxima={hoy()} />
      </div>

      {puntos.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Todavía no hay puntos de venta activos. Créalos en Configuración → Puntos de Venta.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jornadas.map((j) => {
          const t = totales(j.estado);
          const cerrada = j.estado.tipo === "existe" && j.estado.cerrada;
          const consulta = `?fecha=${fecha}`;
          return (
            <section key={j.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold">{j.nombre}</h2>
                {cerrada ? (
                  <Insignia color="verde">Cerrada</Insignia>
                ) : j.estado.tipo === "existe" || j.estado.tipo === "nueva" ? (
                  <Insignia color="marca">Por cerrar</Insignia>
                ) : (
                  <Insignia color="gris">Bloqueada</Insignia>
                )}
              </div>

              {t ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Cifra titulo="Le quedó antes" valor={t.anterior} />
                    <Cifra titulo="Recibió hoy" valor={t.recibidas} color="text-sky-700" />
                    <Cifra titulo="Inicial" valor={t.inicial} />
                    <Cifra titulo="Quedaron" valor={t.final} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                    <span className="text-sm font-medium text-emerald-800">Vendidas</span>
                    <span className={`text-2xl font-bold ${t.final === null ? "text-emerald-300" : "text-emerald-700"}`}>
                      {t.final === null ? "—" : fmt(t.inicial - t.final)}
                    </span>
                  </div>
                </>
              ) : null}

              <p className="text-xs text-slate-500">
                {j.estado.tipo === "pendiente" && (
                  <>
                    La jornada del{" "}
                    <Link className="font-medium text-marca-600 underline" href={`/jornada?fecha=${j.estado.fecha}`}>
                      {formatearFecha(j.estado.fecha)}
                    </Link>{" "}
                    no se ha cerrado. Ciérrala primero.
                  </>
                )}
                {j.estado.tipo === "posterior" && <>No tuvo jornada este día (ya tiene jornadas posteriores).</>}
                {j.estado.tipo === "nueva" && (t?.inicial ? "Todavía no ha recibido manillas hoy; trabaja con las que le quedaron." : "No tiene manillas. Agrégale para empezar.")}
                {j.estado.tipo === "existe" && j.estado.cerrada && (
                  <>
                    Cerrada{j.estado.cerradaEn && ` a las ${formatearHora(j.estado.cerradaEn)}`}
                    {j.estado.cerradaPor && ` por ${j.estado.cerradaPor}`}. La siguiente jornada empieza con las que quedaron.
                  </>
                )}
                {j.estado.tipo === "existe" && !j.estado.cerrada && "Abierta. Al terminar el día, cuenta lo que quedó y registra el cierre."}
              </p>

              <div className="mt-auto flex gap-2">
                {cerrada ? (
                  <Link href={`/jornada/${j.id}/cierre${consulta}`} className={`${boton} bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50`}>
                    Ver planilla
                  </Link>
                ) : j.estado.tipo === "existe" || j.estado.tipo === "nueva" ? (
                  <>
                    <Link href={`/jornada/${j.id}/agregar${consulta}`} className={`${boton} bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50`}>
                      Agregar manillas
                    </Link>
                    <Link href={`/jornada/${j.id}/cierre${consulta}`} className={`${boton} bg-marca-600 text-white hover:bg-marca-700`}>
                      Registrar cierre
                    </Link>
                  </>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      {puntos.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-semibold">Resumen del {formatearFecha(fecha)}</h2>
          <div className="overflow-auto border-t border-slate-300">
            <table className="w-full text-left text-sm">
              <thead className={claseEncabezadoFijo}>
                <tr>
                  <th className="px-4 py-3 font-medium">Punto de venta</th>
                  <th className="px-4 py-3 text-right font-medium">Le quedó antes</th>
                  <th className="px-4 py-3 text-right font-medium">Recibió hoy</th>
                  <th className="px-4 py-3 text-right font-medium">Inicial</th>
                  <th className="px-4 py-3 text-right font-medium">Quedaron</th>
                  <th className="px-4 py-3 text-right font-medium">Vendidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jornadas.map((j) => {
                  const t = totales(j.estado);
                  const vacio = <span className="text-slate-300">—</span>;
                  return (
                    <tr key={j.id}>
                      <td className="px-4 py-2.5 font-semibold">{j.nombre}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{t ? fmt(t.anterior) : vacio}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-sky-700">{t ? fmt(t.recibidas) : vacio}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{t ? fmt(t.inicial) : vacio}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{t?.final != null ? fmt(t.final) : vacio}</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums text-emerald-700">
                        {t?.final != null ? fmt(t.inicial - t.final) : vacio}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-crema-50 font-bold">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(suma("anterior"))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sky-700">{fmt(suma("recibidas"))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(suma("inicial"))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(suma("final"))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{fmt(vendidas)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {cerradas.length} de {puntos.length} punto(s) cerrado(s). Las vendidas solo se cuentan al cerrar.
          </p>
        </section>
      )}
    </div>
  );
}
