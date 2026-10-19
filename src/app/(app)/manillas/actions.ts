"use server";

// Acciones del módulo de manillas. Cualquier usuario puede registrar ventas;
// solo los administradores manejan las categorías y borran registros.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { categoriaManilla, ventaManilla } from "@/db/schema";
import type { Estado } from "@/lib/errores";
import { esFechaValida } from "@/lib/fechas";
import { requireAdmin, requireSession } from "@/lib/session";

function texto(datos: FormData, campo: string) {
  return String(datos.get(campo) ?? "").trim();
}

function entero(datos: FormData, campo: string) {
  const valor = Number(texto(datos, campo));
  return Number.isInteger(valor) ? valor : NaN;
}

// Código de PostgreSQL cuando se repite un valor que debe ser único.
function esDuplicado(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "23505";
}

export async function registrarVenta(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user } = await requireSession();
  const categoriaId = entero(datos, "categoriaId");
  const cantidad = entero(datos, "cantidad");
  const fecha = texto(datos, "fecha");

  if (!(cantidad > 0)) return { ok: false, mensaje: "La cantidad debe ser un número mayor que 0." };
  if (!esFechaValida(fecha)) return { ok: false, mensaje: "La fecha no es válida." };

  const [categoria] = await getDb()
    .select()
    .from(categoriaManilla)
    .where(eq(categoriaManilla.id, categoriaId));
  if (!categoria?.activa) return { ok: false, mensaje: "Elige una categoría activa." };

  await getDb().insert(ventaManilla).values({ categoriaId, cantidad, fecha, usuarioId: user.id });
  revalidatePath("/manillas");
  return { ok: true, mensaje: `Registradas ${cantidad} manilla(s) ${categoria.nombre}.` };
}

export async function eliminarVenta(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  await getDb().delete(ventaManilla).where(eq(ventaManilla.id, entero(datos, "id")));
  revalidatePath("/manillas");
  return { ok: true, mensaje: "Registro eliminado." };
}

export async function crearCategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, mensaje: "Escribe un nombre." };
  try {
    await getDb()
      .insert(categoriaManilla)
      .values({ nombre, color: texto(datos, "color"), descripcion: texto(datos, "descripcion") || null });
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una categoría con ese nombre." };
    throw error;
  }
  revalidatePath("/manillas", "layout");
  return { ok: true, mensaje: `Categoría "${nombre}" creada.` };
}

export async function actualizarCategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, mensaje: "Escribe un nombre." };
  try {
    await getDb()
      .update(categoriaManilla)
      .set({
        nombre,
        color: texto(datos, "color"),
        descripcion: texto(datos, "descripcion") || null,
        activa: datos.get("activa") === "on",
      })
      .where(eq(categoriaManilla.id, entero(datos, "id")));
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una categoría con ese nombre." };
    throw error;
  }
  revalidatePath("/manillas", "layout");
  return { ok: true, mensaje: "Cambios guardados." };
}

export async function eliminarCategoria(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const id = entero(datos, "id");
  const [venta] = await getDb()
    .select({ id: ventaManilla.id })
    .from(ventaManilla)
    .where(eq(ventaManilla.categoriaId, id))
    .limit(1);
  if (venta) {
    return {
      ok: false,
      mensaje: "Tiene ventas registradas, así que no se puede eliminar. Desmárcala como activa.",
    };
  }
  await getDb().delete(categoriaManilla).where(eq(categoriaManilla.id, id));
  revalidatePath("/manillas", "layout");
  return { ok: true, mensaje: "Categoría eliminada." };
}
