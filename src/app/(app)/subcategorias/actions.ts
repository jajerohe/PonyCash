"use server";

// Acciones del módulo de subcategorías. Cada una revisa el permiso del perfil.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { subcategoria } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import type { Estado } from "@/lib/errores";

function texto(datos: FormData, campo: string) {
  return String(datos.get(campo) ?? "").trim();
}

function entero(datos: FormData, campo: string) {
  const valor = Number(texto(datos, campo));
  return Number.isInteger(valor) ? valor : 0;
}

// Código de PostgreSQL cuando se repite un valor que debe ser único.
function esDuplicado(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "23505";
}

export async function crearSubcategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("subcategorias.crear");
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la subcategoría." };
  try {
    await getDb().insert(subcategoria).values({ nombre, orden: entero(datos, "orden") });
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una subcategoría con ese nombre." };
    throw error;
  }
  revalidatePath("/subcategorias");
  return { ok: true, mensaje: `Subcategoría "${nombre}" creada.` };
}

export async function actualizarSubcategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("subcategorias.editar");
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la subcategoría." };
  try {
    await getDb()
      .update(subcategoria)
      .set({ nombre, orden: entero(datos, "orden"), activa: datos.get("activa") === "on" })
      .where(eq(subcategoria.id, entero(datos, "id")));
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una subcategoría con ese nombre." };
    throw error;
  }
  revalidatePath("/subcategorias");
  return { ok: true, mensaje: "Guardado." };
}

export async function eliminarSubcategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("subcategorias.eliminar");
  await getDb().delete(subcategoria).where(eq(subcategoria.id, entero(datos, "id")));
  revalidatePath("/subcategorias");
  return { ok: true, mensaje: "Subcategoría eliminada." };
}
