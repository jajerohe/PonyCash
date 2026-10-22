// Datos comunes de las páginas de una jornada (agregar manillas y cierre).
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { producto, puntoVenta, puntoVentaProducto } from "@/db/schema";
import { esFechaValida, hoy } from "@/lib/fechas";
import { estadoJornada } from "@/lib/inventario";

export async function datosJornada(params: Promise<{ punto: string }>, searchParams: Promise<{ fecha?: string }>) {
  const puntoId = Number((await params).punto) || 0;
  const pedida = (await searchParams).fecha ?? "";
  const fecha = esFechaValida(pedida) && pedida <= hoy() ? pedida : hoy();

  const db = getDb();
  const [punto] = await db.select({ id: puntoVenta.id, nombre: puntoVenta.nombre }).from(puntoVenta).where(eq(puntoVenta.id, puntoId));
  if (!punto) notFound();

  const [estado, productos, habilitados] = await Promise.all([
    estadoJornada(db, punto.id, fecha),
    db.select({ id: producto.id, nombre: producto.nombre, activa: producto.activa }).from(producto).orderBy(asc(producto.nombre)),
    db
      .select({ productoId: puntoVentaProducto.productoId })
      .from(puntoVentaProducto)
      .where(eq(puntoVentaProducto.puntoVentaId, punto.id)),
  ]);
  return { punto, fecha, estado, productos, habilitados: new Set(habilitados.map((h) => h.productoId)) };
}
