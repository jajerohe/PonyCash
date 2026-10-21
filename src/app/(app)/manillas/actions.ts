"use server";

// Acciones del módulo de manillas. Solo los administradores pueden cambiarlas.
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { manilla, tarifa, tipoTarifa } from "@/db/schema";
import { esDuplicado, type Estado } from "@/lib/errores";
import { finDeAnio, hoy } from "@/lib/fechas";
import { requireAdmin } from "@/lib/session";

// Toda manilla nueva nace con su tarifa Plena predeterminada: $0, vigente
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
    const [nueva] = await tx.insert(manilla).values({ nombre, descripcion }).returning({ id: manilla.id });
    await tx.insert(tarifa).values({
      manillaId: nueva.id,
      tipoTarifaId: plena.id,
      valor: 0,
      desde: hoy(),
      hasta: finDeAnio(),
      predeterminada: true,
    });
  });
}

export async function guardarManilla(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const id = Number(datos.get("id")) || 0; // 0 = manilla nueva
  const nombre = String(datos.get("nombre") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim() || null;
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la manilla." };

  try {
    if (id) await getDb().update(manilla).set({ nombre, descripcion }).where(eq(manilla.id, id));
    else await crearConTarifaPlena(nombre, descripcion);
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una manilla con ese nombre." };
    throw error;
  }
  revalidatePath("/manillas");
  revalidatePath("/tarifas");
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
  // Sus tarifas se borran con ella (la base de datos lo hace en cascada).
  const [borrada] = await getDb().delete(manilla).where(eq(manilla.id, id)).returning({ nombre: manilla.nombre });
  revalidatePath("/manillas");
  revalidatePath("/tarifas");
  return borrada
    ? { ok: true, mensaje: `Manilla "${borrada.nombre}" eliminada.` }
    : { ok: false, mensaje: "La manilla ya no existe." };
}
