import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { producto } from "@/db/schema";
import { existencias, manillasEnPuntos, totalEnPuntos } from "@/lib/inventario";
import { requireSession } from "@/lib/session";
import { ListadoInventario } from "./listado";

export default async function InventarioPage() {
  const { user } = await requireSession();
  const db = getDb();
  const [productos, existencia, enPuntos] = await Promise.all([
    db
      .select({ id: producto.id, nombre: producto.nombre, activa: producto.activa, minimo: producto.minimo })
      .from(producto)
      .orderBy(asc(producto.nombre)),
    existencias(db),
    manillasEnPuntos(db),
  ]);
  const porProducto = totalEnPuntos(enPuntos);

  const filas = productos
    .map((p) => ({ ...p, existencia: existencia.get(p.id) ?? 0, enPuntos: porProducto.get(p.id) ?? 0 }))
    // Los productos inactivos solo se muestran si todavía tienen manillas.
    .filter((p) => p.activa || p.existencia !== 0);

  return <ListadoInventario filas={filas} puntos={enPuntos.size} puedeEditar={user.role === "admin"} />;
}
