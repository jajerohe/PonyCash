"use server";

// Acciones de tipos de tarifa. Solo los administradores pueden cambiarlos y
// los protegidos (la tarifa Plena) no se modifican, desactivan ni eliminan.
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { tipoTarifa } from "@/db/schema";
import { esDuplicado, type Estado } from "@/lib/errores";
import { requireAdmin } from "@/lib/session";

const PROTEGIDO: Estado = { ok: false, mensaje: "Este tipo de tarifa viene con el sistema y no se puede modificar." };

// Busca el tipo de tarifa; devuelve un mensaje si no existe o está protegido.
async function buscarEditable(
  id: number,
): Promise<{ error: Estado } | { actual: typeof tipoTarifa.$inferSelect }> {
  const [actual] = await getDb().select().from(tipoTarifa).where(eq(tipoTarifa.id, id));
  if (!actual) return { error: { ok: false, mensaje: "El tipo de tarifa ya no existe." } };
  if (actual.protegido) return { error: PROTEGIDO };
  return { actual };
}

// Condición para tocar solo registros no protegidos.
const editable = (id: number) => and(eq(tipoTarifa.id, id), eq(tipoTarifa.protegido, false));

export async function guardarTipoTarifa(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const id = Number(datos.get("id")) || 0; // 0 = tipo nuevo
  const nombre = String(datos.get("nombre") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim() || null;
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre del tipo de tarifa." };

  try {
    if (id) {
      const buscado = await buscarEditable(id);
      if ("error" in buscado) return buscado.error;
      await getDb().update(tipoTarifa).set({ nombre, descripcion }).where(editable(id));
    } else {
      await getDb().insert(tipoTarifa).values({ nombre, descripcion });
    }
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe un tipo de tarifa con ese nombre." };
    throw error;
  }
  revalidatePath("/tipos-tarifa");
  return { ok: true, mensaje: `Tipo de tarifa "${nombre}" ${id ? "actualizado" : "creado"}.` };
}

export async function cambiarEstadoTipoTarifa(id: number): Promise<Estado> {
  await requireAdmin();
  const buscado = await buscarEditable(id);
  if ("error" in buscado) return buscado.error;
  const { actual } = buscado;
  await getDb().update(tipoTarifa).set({ activa: !actual.activa }).where(editable(id));
  revalidatePath("/tipos-tarifa");
  return { ok: true, mensaje: `Tipo de tarifa "${actual.nombre}" ${actual.activa ? "desactivado" : "activado"}.` };
}

export async function eliminarTipoTarifa(id: number): Promise<Estado> {
  await requireAdmin();
  const buscado = await buscarEditable(id);
  if ("error" in buscado) return buscado.error;
  const { actual } = buscado;
  await getDb().delete(tipoTarifa).where(editable(id));
  revalidatePath("/tipos-tarifa");
  return { ok: true, mensaje: `Tipo de tarifa "${actual.nombre}" eliminado.` };
}
