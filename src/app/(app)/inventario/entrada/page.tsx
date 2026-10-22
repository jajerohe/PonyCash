import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { producto } from "@/db/schema";
import { hoy } from "@/lib/fechas";
import { existencias } from "@/lib/inventario";
import { requireAdmin } from "@/lib/session";
import { FormularioEntrada } from "./formulario";

export default async function EntradaPage() {
  await requireAdmin();
  const db = getDb();
  const [productos, existencia] = await Promise.all([
    db.select({ id: producto.id, nombre: producto.nombre }).from(producto).where(eq(producto.activa, true)).orderBy(asc(producto.nombre)),
    existencias(db),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/inventario" className="text-sm text-marca-600 hover:underline">
          ← Inventario general
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Registrar entrada</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manillas que llegan al inventario (compra, impresión…). Escribe solo las de los productos que llegaron.
        </p>
      </div>
      <FormularioEntrada productos={productos.map((p) => ({ ...p, existencia: existencia.get(p.id) ?? 0 }))} fecha={hoy()} />
    </div>
  );
}
