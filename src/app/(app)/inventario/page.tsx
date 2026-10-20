import Link from "next/link";
import { asc } from "drizzle-orm";
import { Insignia, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { categoria, producto } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";

const numero = (n: number) => n.toLocaleString("es-CO");

export default async function InventarioPage() {
  const { puede } = await requirePermiso("inventario.ver");

  const db = getDb();
  const [categorias, productos] = await Promise.all([
    db.select().from(categoria).orderBy(asc(categoria.orden), asc(categoria.nombre)),
    db.select().from(producto).orderBy(asc(producto.orden), asc(producto.nombre)),
  ]);
  const totalGeneral = productos.reduce((suma, p) => suma + p.cantidad, 0);
  // Solo las categorías que tienen productos.
  const grupos = categorias
    .map((c) => ({ ...c, productos: productos.filter((p) => p.categoriaId === c.id) }))
    .filter((c) => c.productos.length > 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-slate-500">
            {productos.length} producto(s) · {numero(totalGeneral)} unidades en total
          </p>
        </div>
        {puede("inventario.crear") && (
          <Link
            href="/inventario/nuevo"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            + Nuevo producto
          </Link>
        )}
      </div>

      {grupos.length === 0 && (
        <Tarjeta>
          <p className="text-sm text-slate-500">Todavía no hay productos en el inventario.</p>
        </Tarjeta>
      )}

      {grupos.map((c) => {
        const total = c.productos.reduce((suma, p) => suma + p.cantidad, 0);
        return (
          <Tarjeta key={c.id} className="overflow-x-auto p-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-6 pt-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {c.nombre}
                {!c.activa && <Insignia color="gris">Categoría inactiva</Insignia>}
              </h2>
              <p className="text-sm text-slate-500">{numero(total)} unidades</p>
            </div>
            <table className="mt-4 w-full text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Producto</th>
                  <th className="px-6 py-3 text-right font-medium">Cantidad</th>
                  {puede("inventario.editar") && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {c.productos.map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50 ${p.activo ? "" : "text-slate-400"}`}>
                    <td className="px-6 py-3 font-medium">
                      <span className="flex items-center gap-2">
                        {p.nombre}
                        {!p.activo && <Insignia color="gris">Inactivo</Insignia>}
                        {p.activo && p.cantidad === 0 && <Insignia color="rojo">Agotado</Insignia>}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">{numero(p.cantidad)}</td>
                    {puede("inventario.editar") && (
                      <td className="px-6 py-3 text-right">
                        <Link href={`/inventario/${p.id}`} className="font-medium text-violet-600 hover:underline">
                          Editar
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>
        );
      })}
    </div>
  );
}
