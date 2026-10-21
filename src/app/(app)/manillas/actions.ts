"use server";

// Acciones del módulo de manillas. Solo los administradores pueden cambiarlas.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { manilla } from "@/db/schema";
import { esDuplicado, type Estado } from "@/lib/errores";
import { requireAdmin } from "@/lib/session";

export async function guardarManilla(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const id = Number(datos.get("id")) || 0; // 0 = manilla nueva
  const nombre = String(datos.get("nombre") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim() || null;
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la manilla." };

  try {
    if (id) await getDb().update(manilla).set({ nombre, descripcion }).where(eq(manilla.id, id));
    else await getDb().insert(manilla).values({ nombre, descripcion });
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una manilla con ese nombre." };
    throw error;
  }
  revalidatePath("/manillas");
  return { ok: true, mensaje: id ? `Manilla "${nombre}" actualizada.` : `Manilla "${nombre}" creada.` };
}

export async function cambiarEstadoManilla(id: number): Promise<Estado> {
  await requireAdmin();
  const [actual] = await getDb().select().from(manilla).where(eq(manilla.id, id));
  if (!actual) return { ok: false, mensaje: "La manilla ya no existe." };
  await getDb().update(manilla).set({ activa: !actual.activa }).where(eq(manilla.id, id));
  revalidatePath("/manillas");
  return { ok: true, mensaje: `Manilla "${actual.nombre}" ${actual.activa ? "desactivada" : "activada"}.` };
}

export async function eliminarManilla(id: number): Promise<Estado> {
  await requireAdmin();
  const [borrada] = await getDb().delete(manilla).where(eq(manilla.id, id)).returning({ nombre: manilla.nombre });
  revalidatePath("/manillas");
  return borrada
    ? { ok: true, mensaje: `Manilla "${borrada.nombre}" eliminada.` }
    : { ok: false, mensaje: "La manilla ya no existe." };
}
