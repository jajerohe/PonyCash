"use server";

// Acciones de puntos de venta. Solo los administradores pueden cambiarlos.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { puntoVenta } from "@/db/schema";
import { esDuplicado, type Estado } from "@/lib/errores";
import { requireAdmin } from "@/lib/session";

export async function guardarPuntoVenta(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const id = Number(datos.get("id")) || 0; // 0 = punto de venta nuevo
  const nombre = String(datos.get("nombre") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim() || null;
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre del punto de venta." };

  try {
    if (id) await getDb().update(puntoVenta).set({ nombre, descripcion }).where(eq(puntoVenta.id, id));
    else await getDb().insert(puntoVenta).values({ nombre, descripcion });
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe un punto de venta con ese nombre." };
    throw error;
  }
  revalidatePath("/puntos-venta");
  return { ok: true, mensaje: `Punto de venta "${nombre}" ${id ? "actualizado" : "creado"}.` };
}

export async function cambiarEstadoPuntoVenta(id: number): Promise<Estado> {
  await requireAdmin();
  const [actual] = await getDb().select().from(puntoVenta).where(eq(puntoVenta.id, id));
  if (!actual) return { ok: false, mensaje: "El punto de venta ya no existe." };
  await getDb().update(puntoVenta).set({ activa: !actual.activa }).where(eq(puntoVenta.id, id));
  revalidatePath("/puntos-venta");
  return { ok: true, mensaje: `Punto de venta "${actual.nombre}" ${actual.activa ? "desactivado" : "activado"}.` };
}

export async function eliminarPuntoVenta(id: number): Promise<Estado> {
  await requireAdmin();
  const [borrado] = await getDb()
    .delete(puntoVenta)
    .where(eq(puntoVenta.id, id))
    .returning({ nombre: puntoVenta.nombre });
  revalidatePath("/puntos-venta");
  return borrado
    ? { ok: true, mensaje: `Punto de venta "${borrado.nombre}" eliminado.` }
    : { ok: false, mensaje: "El punto de venta ya no existe." };
}
