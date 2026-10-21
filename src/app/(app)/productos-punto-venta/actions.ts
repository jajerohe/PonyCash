"use server";

// Guarda qué productos puede vender un punto de venta. Solo administradores.
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { producto, puntoVenta, puntoVentaProducto } from "@/db/schema";
import type { Estado } from "@/lib/errores";
import { requireAdmin } from "@/lib/session";

export async function guardarProductosDelPunto(puntoVentaId: number, productoIds: number[]): Promise<Estado> {
  await requireAdmin();
  const db = getDb();
  const [punto] = await db.select().from(puntoVenta).where(eq(puntoVenta.id, puntoVentaId));
  if (!punto) return { ok: false, mensaje: "El punto de venta ya no existe." };

  // Solo se cambian los productos activos; las asignaciones de productos
  // inactivas se conservan como estaban.
  const activas = await db.select({ id: producto.id }).from(producto).where(eq(producto.activa, true));
  const idsActivas = activas.map((m) => m.id);
  const elegidas = [...new Set(productoIds)].filter((id) => idsActivas.includes(id));

  await db.transaction(async (tx) => {
    if (idsActivas.length > 0) {
      await tx
        .delete(puntoVentaProducto)
        .where(and(eq(puntoVentaProducto.puntoVentaId, puntoVentaId), inArray(puntoVentaProducto.productoId, idsActivas)));
    }
    if (elegidas.length > 0) {
      await tx.insert(puntoVentaProducto).values(elegidas.map((productoId) => ({ puntoVentaId, productoId })));
    }
  });

  revalidatePath("/productos-punto-venta");
  return { ok: true, mensaje: `Productos de "${punto.nombre}" guardados: ${elegidas.length} habilitado(s).` };
}
