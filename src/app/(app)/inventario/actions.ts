"use server";

// Acciones del inventario. Cada una revisa el permiso del perfil.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { producto } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import type { Estado } from "@/lib/errores";

function texto(datos: FormData, campo: string) {
  return String(datos.get(campo) ?? "").trim();
}

function entero(datos: FormData, campo: string) {
  // Acepta "1.000" o "1000".
  const valor = Number(texto(datos, campo).replace(/\./g, ""));
  return Number.isInteger(valor) ? valor : NaN;
}

// Código de PostgreSQL cuando se repite un valor que debe ser único.
function esDuplicado(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "23505";
}

export async function guardarProducto(_estado: Estado, datos: FormData): Promise<Estado> {
  const id = entero(datos, "id") || 0; // 0 = producto nuevo
  await requirePermiso(id ? "inventario.editar" : "inventario.crear");

  const nombre = texto(datos, "nombre");
  const categoriaId = entero(datos, "categoriaId");
  const cantidad = entero(datos, "cantidad");
  const orden = entero(datos, "orden") || 0;
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre del producto." };
  if (!(categoriaId > 0)) return { ok: false, mensaje: "Elige una categoría." };
  if (!(cantidad >= 0)) return { ok: false, mensaje: "La cantidad debe ser un número entero mayor o igual a 0." };

  const valores = { nombre, categoriaId, cantidad, orden, activo: datos.get("activo") === "on" };
  try {
    if (id) await getDb().update(producto).set(valores).where(eq(producto.id, id));
    else await getDb().insert(producto).values(valores);
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe un producto con ese nombre en esa categoría." };
    throw error;
  }

  revalidatePath("/inventario", "layout");
  if (!id) redirect("/inventario");
  return { ok: true, mensaje: "Producto guardado." };
}

export async function eliminarProducto(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("inventario.eliminar");
  await getDb().delete(producto).where(eq(producto.id, entero(datos, "id")));
  revalidatePath("/inventario", "layout");
  redirect("/inventario");
}
