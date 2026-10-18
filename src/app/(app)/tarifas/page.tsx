import Link from "next/link";
import { asc } from "drizzle-orm";
import { Insignia, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { categoria, manilla, tarifa, tipoTarifa } from "@/db/schema";
import { formatearPesos } from "@/lib/pesos";
import { requireSession } from "@/lib/session";

const botonSecundario =
  "rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50";

export default async function TarifasPage() {
  const { user } = await requireSession();
  const esAdmin = user.role === "admin";

  const db = getDb();
  const [categorias, tipos, manillas, tarifas] = await Promise.all([
    db.select().from(categoria).orderBy(asc(categoria.orden), asc(categoria.nombre)),
    db.select().from(tipoTarifa).orderBy(asc(tipoTarifa.orden), asc(tipoTarifa.nombre)),
    db.select().from(manilla).orderBy(asc(manilla.orden), asc(manilla.nombre)),
    db.select().from(tarifa),
  ]);

  // valor[manillaId][tipoTarifaId]
  const valor = new Map<number, Map<number, number>>();
  for (const t of tarifas) {
    if (!valor.has(t.manillaId)) valor.set(t.manillaId, new Map());
    valor.get(t.manillaId)!.set(t.tipoTarifaId, t.valor);
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tarifas</h1>
          <p className="text-sm text-slate-500">Valor de cada manilla según el tipo de tarifa</p>
        </div>
        {esAdmin && (
          <div className="flex flex-wrap gap-2">
            <Link href="/tarifas/configuracion" className={botonSecundario}>
              Categorías y tipos de tarifa
            </Link>
            <Link
              href="/tarifas/manillas/nueva"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              + Nueva manilla
            </Link>
          </div>
        )}
      </div>

      {categorias.length === 0 && (
        <Tarjeta>
          <p className="text-sm text-slate-500">Todavía no hay categorías.</p>
        </Tarjeta>
      )}

      {categorias.map((cat) => {
        const suyas = manillas.filter((m) => m.categoriaId === cat.id);
        // Columnas: solo los tipos de tarifa que alguna manilla de esta categoría usa.
        const columnas = tipos.filter((t) => suyas.some((m) => valor.get(m.id)?.has(t.id)));

        return (
          <Tarjeta key={cat.id} className="overflow-x-auto p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {cat.nombre}
                {!cat.activa && <Insignia color="gris">Inactiva</Insignia>}
              </h2>
              {esAdmin && (
                <Link
                  href={`/tarifas/manillas/nueva?categoria=${cat.id}`}
                  className="text-sm font-medium text-violet-600 hover:underline"
                >
                  + Agregar manilla
                </Link>
              )}
            </div>

            {suyas.length === 0 ? (
              <p className="px-6 pb-6 pt-2 text-sm text-slate-500">Sin manillas.</p>
            ) : (
              <table className="mt-4 w-full text-left text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Manilla</th>
                    {columnas.map((t) => (
                      <th key={t.id} className="whitespace-nowrap px-6 py-3 text-right font-medium">
                        {t.nombre}
                      </th>
                    ))}
                    {esAdmin && <th className="px-6 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suyas.map((m) => (
                    <tr key={m.id} className={`hover:bg-slate-50 ${m.activa ? "" : "text-slate-400"}`}>
                      <td className="px-6 py-3 font-medium">
                        <span className="flex items-center gap-2">
                          {m.nombre}
                          {!m.activa && <Insignia color="gris">Inactiva</Insignia>}
                        </span>
                      </td>
                      {columnas.map((t) => {
                        const v = valor.get(m.id)?.get(t.id);
                        return (
                          <td key={t.id} className="whitespace-nowrap px-6 py-3 text-right tabular-nums">
                            {v === undefined ? <span className="text-slate-300">—</span> : formatearPesos(v)}
                          </td>
                        );
                      })}
                      {esAdmin && (
                        <td className="px-6 py-3 text-right">
                          <Link
                            href={`/tarifas/manillas/${m.id}`}
                            className="font-medium text-violet-600 hover:underline"
                          >
                            Editar
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Tarjeta>
        );
      })}
    </div>
  );
}
