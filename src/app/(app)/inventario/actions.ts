"use server";

// Entradas y ajustes del inventario general. Solo administradores.
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { movimiento, producto } from "@/db/schema";
import type { Estado } from "@/lib/errores";
import { esFechaValida, hoy } from "@/lib/fechas";
import { bloquearInventario, existencias, leerCantidad, manillasEnPuntos, totalEnPuntos } from "@/lib/inventario";
import { requireAdmin } from "@/lib/session";

const error = (mensaje: string): Estado => ({ ok: false, mensaje });

function revalidarInventario() {
  revalidatePath("/inventario");
  revalidatePath("/jornada");
  revalidatePath("/movimientos");
}

// Entrada de manillas (compra, impresión…): suma a la existencia de cada producto.
export async function registrarEntrada(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user } = await requireAdmin();
  const fecha = String(datos.get("fecha") ?? "");
  const detalle = String(datos.get("detalle") ?? "").trim() || null;
  if (!esFechaValida(fecha)) return error("La fecha no es válida.");
  if (fecha > hoy()) return error("La fecha no puede ser futura.");

  const db = getDb();
  const productos = await db.select({ id: producto.id }).from(producto).where(eq(producto.activa, true)).orderBy(asc(producto.nombre));
  const lineas: { productoId: number; cantidad: number }[] = [];
  for (const p of productos) {
    const cantidad = leerCantidad(datos.get(`cantidad-${p.id}`));
    if (cantidad === null) return error("Revisa las cantidades: deben ser números enteros.");
    if (cantidad > 0) lineas.push({ productoId: p.id, cantidad });
  }
  if (lineas.length === 0) return error("Escribe la cantidad de al menos un producto.");

  await db.transaction(async (tx) => {
    await bloquearInventario(tx);
    await tx.insert(movimiento).values(
      lineas.map((l) => ({ fecha, tipo: "entrada" as const, productoId: l.productoId, cantidad: l.cantidad, cambio: l.cantidad, detalle, usuario: user.name })),
    );
  });

  revalidarInventario();
  const total = lineas.reduce((a, l) => a + l.cantidad, 0);
  return { ok: true, mensaje: `Entrada registrada: ${total.toLocaleString("es-CO")} manillas de ${lineas.length} producto(s).` };
}

// Cambia la existencia de un producto (por un conteo, pérdida…) y su mínimo.
export async function ajustarProducto(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user } = await requireAdmin();
  const productoId = Number(datos.get("productoId")) || 0;
  const nueva = leerCantidad(datos.get("existencia"));
  const minimo = leerCantidad(datos.get("minimo"));
  const motivo = String(datos.get("motivo") ?? "").trim();
  if (nueva === null) return error("La existencia debe ser un número entero.");
  if (minimo === null) return error("El mínimo debe ser un número entero.");

  const db = getDb();
  const [p] = await db.select({ id: producto.id, nombre: producto.nombre }).from(producto).where(eq(producto.id, productoId));
  if (!p) return error("El producto ya no existe.");

  const resultado = await db.transaction(async (tx) => {
    await bloquearInventario(tx);
    const actual = (await existencias(tx)).get(productoId) ?? 0;
    const enPuntos = totalEnPuntos(await manillasEnPuntos(tx)).get(productoId) ?? 0;
    const cambio = nueva - actual;
    if (cambio !== 0) {
      if (nueva < enPuntos) {
        return error(`Los puntos de venta tienen ${enPuntos} manillas de este producto: la existencia no puede ser menor.`);
      }
      if (!motivo) return error("Escribe el motivo del ajuste.");
      await tx.insert(movimiento).values({
        fecha: hoy(),
        tipo: "ajuste",
        productoId,
        cantidad: Math.abs(cambio),
        cambio,
        detalle: motivo,
        usuario: user.name,
      });
    }
    await tx.update(producto).set({ minimo }).where(eq(producto.id, productoId));
    return { ok: true, mensaje: cambio === 0 ? `"${p.nombre}" actualizado.` : `"${p.nombre}" ajustado de ${actual} a ${nueva}.` };
  });

  if (resultado?.ok) revalidarInventario();
  return resultado;
}
