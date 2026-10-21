"use server";

// Acciones del módulo de productos. Solo los administradores pueden cambiarlas.
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { producto, tarifa, tipoTarifa } from "@/db/schema";
import { esDuplicado, type Estado } from "@/lib/errores";
import { finDeAnio, hoy } from "@/lib/fechas";
import { requireAdmin } from "@/lib/session";

// Toda producto nueva nace con su tarifa Plena predeterminada: $0, vigente
// desde hoy hasta el último día del año.
async function crearConTarifaPlena(nombre: string, descripcion: string | null) {
  await getDb().transaction(async (tx) => {
    const [plena] = await tx
      .select({ id: tipoTarifa.id })
      .from(tipoTarifa)
      .where(eq(tipoTarifa.protegido, true))
      .orderBy(asc(tipoTarifa.id))
      .limit(1);
    if (!plena) throw new Error("Falta el tipo de tarifa Plena.");
    const [nueva] = await tx.insert(producto).values({ nombre, descripcion }).returning({ id: producto.id });
    await tx.insert(tarifa).values({
      productoId: nueva.id,
      tipoTarifaId: plena.id,
      valor: 0,
      desde: hoy(),
      hasta: finDeAnio(),
      predeterminada: true,
    });
  });
}

export async function guardarProducto(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const id = Number(datos.get("id")) || 0; // 0 = producto nueva
  const nombre = String(datos.get("nombre") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim() || null;
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre del producto." };

  try {
    if (id) await getDb().update(producto).set({ nombre, descripcion }).where(eq(producto.id, id));
    else await crearConTarifaPlena(nombre, descripcion);
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe un producto con ese nombre." };
    throw error;
  }
  revalidatePath("/productos");
  revalidatePath("/tarifas");
  return { ok: true, mensaje: id ? `Producto "${nombre}" actualizado.` : `Producto "${nombre}" creado.` };
}

export async function cambiarEstadoProducto(id: number): Promise<Estado> {
  await requireAdmin();
  const [actual] = await getDb().select().from(producto).where(eq(producto.id, id));
  if (!actual) return { ok: false, mensaje: "El producto ya no existe." };
  await getDb().update(producto).set({ activa: !actual.activa }).where(eq(producto.id, id));
  revalidatePath("/productos");
  return { ok: true, mensaje: `Producto "${actual.nombre}" ${actual.activa ? "desactivado" : "activado"}.` };
}

export async function eliminarProducto(id: number): Promise<Estado> {
  await requireAdmin();
  // Sus tarifas se borran con ella (la base de datos lo hace en cascada).
  const [borrada] = await getDb().delete(producto).where(eq(producto.id, id)).returning({ nombre: producto.nombre });
  revalidatePath("/productos");
  revalidatePath("/tarifas");
  return borrada
    ? { ok: true, mensaje: `Producto "${borrada.nombre}" eliminado.` }
    : { ok: false, mensaje: "El producto ya no existe." };
}
