"use server";

// Acciones de tarifas. Solo los administradores pueden cambiarlas. La tarifa
// predeterminada de cada producto solo admite cambios de valor y fechas.
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { producto, tarifa, tipoTarifa } from "@/db/schema";
import type { Estado } from "@/lib/errores";
import { esFechaValida } from "@/lib/fechas";
import { requireAdmin } from "@/lib/session";

const error = (mensaje: string): Estado => ({ ok: false, mensaje });

// "15.000", "$ 15000" o "15,000" → 15000. Devuelve null si no es un valor válido.
function leerValor(texto: string) {
  const limpio = texto.replace(/[$\s.,]/g, "");
  if (!/^\d{1,10}$/.test(limpio)) return null;
  const valor = Number(limpio);
  return valor <= 2_000_000_000 ? valor : null;
}

// Busca otra tarifa activa del mismo producto y tipo cuyas fechas se crucen.
async function buscarCruce(datos: { id: number; productoId: number; tipoTarifaId: number; desde: string; hasta: string }) {
  const [cruce] = await getDb()
    .select({ desde: tarifa.desde, hasta: tarifa.hasta })
    .from(tarifa)
    .where(
      and(
        ne(tarifa.id, datos.id),
        eq(tarifa.productoId, datos.productoId),
        eq(tarifa.tipoTarifaId, datos.tipoTarifaId),
        eq(tarifa.activa, true),
        lte(tarifa.desde, datos.hasta),
        gte(tarifa.hasta, datos.desde),
      ),
    )
    .limit(1);
  return cruce;
}

const mensajeCruce = "Ya hay una tarifa activa de ese tipo para el producto con fechas que se cruzan.";

async function buscarTarifa(id: number) {
  const [actual] = await getDb().select().from(tarifa).where(eq(tarifa.id, id));
  return actual;
}

export async function guardarTarifa(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const id = Number(datos.get("id")) || 0; // 0 = tarifa nueva
  const valor = leerValor(String(datos.get("valor") ?? ""));
  const desde = String(datos.get("desde") ?? "");
  const hasta = String(datos.get("hasta") ?? "");
  let productoId = Number(datos.get("productoId")) || 0;
  let tipoTarifaId = Number(datos.get("tipoTarifaId")) || 0;

  if (valor === null) return error("Escribe un valor válido, sin centavos (por ejemplo 15000).");
  if (!esFechaValida(desde) || !esFechaValida(hasta)) return error("Escribe las fechas desde y hasta.");
  if (hasta < desde) return error("La fecha hasta no puede ser anterior a la fecha desde.");

  const actual = id ? await buscarTarifa(id) : undefined;
  if (id && !actual) return error("La tarifa ya no existe.");
  if (actual?.predeterminada) {
    // En la predeterminada no se cambian ni el producto ni el tipo.
    productoId = actual.productoId;
    tipoTarifaId = actual.tipoTarifaId;
  } else {
    if (!productoId) return error("Elige el producto.");
    if (!tipoTarifaId) return error("Elige el tipo de tarifa.");
    const [m] = await getDb().select({ id: producto.id }).from(producto).where(eq(producto.id, productoId));
    if (!m) return error("El producto ya no existe.");
    const [t] = await getDb().select({ id: tipoTarifa.id }).from(tipoTarifa).where(eq(tipoTarifa.id, tipoTarifaId));
    if (!t) return error("El tipo de tarifa ya no existe.");
  }

  if ((actual?.activa ?? true) && (await buscarCruce({ id, productoId, tipoTarifaId, desde, hasta }))) {
    return error(mensajeCruce);
  }

  if (actual) {
    await getDb().update(tarifa).set({ productoId, tipoTarifaId, valor, desde, hasta }).where(eq(tarifa.id, id));
  } else {
    await getDb().insert(tarifa).values({ productoId, tipoTarifaId, valor, desde, hasta });
  }
  revalidatePath("/tarifas");
  return { ok: true, mensaje: id ? "Tarifa actualizada." : "Tarifa creada." };
}

export async function cambiarEstadoTarifa(id: number): Promise<Estado> {
  await requireAdmin();
  const actual = await buscarTarifa(id);
  if (!actual) return error("La tarifa ya no existe.");
  if (actual.predeterminada) return error("La tarifa predeterminada del producto no se puede desactivar.");
  if (!actual.activa && (await buscarCruce(actual))) return error(`No se puede activar. ${mensajeCruce}`);
  await getDb().update(tarifa).set({ activa: !actual.activa }).where(eq(tarifa.id, id));
  revalidatePath("/tarifas");
  return { ok: true, mensaje: actual.activa ? "Tarifa desactivada." : "Tarifa activada." };
}

export async function eliminarTarifa(id: number): Promise<Estado> {
  await requireAdmin();
  const actual = await buscarTarifa(id);
  if (!actual) return error("La tarifa ya no existe.");
  if (actual.predeterminada) return error("La tarifa predeterminada del producto no se puede eliminar.");
  await getDb().delete(tarifa).where(and(eq(tarifa.id, id), eq(tarifa.predeterminada, false)));
  revalidatePath("/tarifas");
  return { ok: true, mensaje: "Tarifa eliminada." };
}
