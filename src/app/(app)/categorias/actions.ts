"use server";

// Acciones del módulo de categorías. Cada una revisa el permiso del perfil.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { categoria, producto } from "@/db/schema";
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

export async function crearCategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("categorias.crear");
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la categoría." };
  try {
    await getDb().insert(categoria).values({ nombre, orden: entero(datos, "orden") });
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una categoría con ese nombre." };
    throw error;
  }
  revalidatePath("/categorias");
  return { ok: true, mensaje: `Categoría "${nombre}" creada.` };
}

export async function actualizarCategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("categorias.editar");
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la categoría." };
  try {
    await getDb()
      .update(categoria)
      .set({ nombre, orden: entero(datos, "orden"), activa: datos.get("activa") === "on" })
      .where(eq(categoria.id, entero(datos, "id")));
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una categoría con ese nombre." };
    throw error;
  }
  revalidatePath("/categorias");
  return { ok: true, mensaje: "Guardado." };
}

export async function eliminarCategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("categorias.eliminar");
  const id = entero(datos, "id");
  const [conProductos] = await getDb()
    .select({ id: producto.id })
    .from(producto)
    .where(eq(producto.categoriaId, id))
    .limit(1);
  if (conProductos) {
    return {
      ok: false,
      mensaje: "Tiene productos en el inventario. Muévelos o elimínalos primero, o desmárcala como activa.",
    };
  }
  await getDb().delete(categoria).where(eq(categoria.id, id));
  revalidatePath("/categorias");
  return { ok: true, mensaje: "Categoría eliminada." };
}
