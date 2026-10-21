"use server";

// Guarda qué manillas puede vender un punto de venta. Solo administradores.
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { manilla, puntoVenta, puntoVentaManilla } from "@/db/schema";
import type { Estado } from "@/lib/errores";
import { requireAdmin } from "@/lib/session";

export async function guardarManillasDelPunto(puntoVentaId: number, manillaIds: number[]): Promise<Estado> {
  await requireAdmin();
  const db = getDb();
  const [punto] = await db.select().from(puntoVenta).where(eq(puntoVenta.id, puntoVentaId));
  if (!punto) return { ok: false, mensaje: "El punto de venta ya no existe." };

  // Solo se cambian las manillas activas; las asignaciones de manillas
  // inactivas se conservan como estaban.
  const activas = await db.select({ id: manilla.id }).from(manilla).where(eq(manilla.activa, true));
  const idsActivas = activas.map((m) => m.id);
  const elegidas = [...new Set(manillaIds)].filter((id) => idsActivas.includes(id));

  await db.transaction(async (tx) => {
    if (idsActivas.length > 0) {
      await tx
        .delete(puntoVentaManilla)
        .where(and(eq(puntoVentaManilla.puntoVentaId, puntoVentaId), inArray(puntoVentaManilla.manillaId, idsActivas)));
    }
    if (elegidas.length > 0) {
      await tx.insert(puntoVentaManilla).values(elegidas.map((manillaId) => ({ puntoVentaId, manillaId })));
    }
  });

  revalidatePath("/manillas-punto-venta");
  return { ok: true, mensaje: `Manillas de "${punto.nombre}" guardadas: ${elegidas.length} habilitada(s).` };
}
