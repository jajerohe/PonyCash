import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { producto, puntoVenta, puntoVentaProducto } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { ProductosPorPunto } from "./asignacion";

export default async function ProductosPuntoVentaPage() {
  const { user } = await requireSession();
  const db = getDb();
  const [puntos, productos, asignaciones] = await Promise.all([
    db
      .select({ id: puntoVenta.id, nombre: puntoVenta.nombre, descripcion: puntoVenta.descripcion, activa: puntoVenta.activa })
      .from(puntoVenta)
      .orderBy(asc(puntoVenta.nombre)),
    db.select({ id: producto.id, nombre: producto.nombre, activa: producto.activa }).from(producto).orderBy(asc(producto.nombre)),
    db.select({ puntoVentaId: puntoVentaProducto.puntoVentaId, productoId: puntoVentaProducto.productoId }).from(puntoVentaProducto),
  ]);

  return (
    <ProductosPorPunto
      puntos={puntos}
      productos={productos}
      asignaciones={asignaciones}
      puedeEditar={user.role === "admin"}
    />
  );
}
