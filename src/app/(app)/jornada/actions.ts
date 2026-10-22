"use server";

// Jornada de un punto de venta: agregar manillas, cerrar (contar lo que quedó)
// y reabrir un cierre equivocado.
import { and, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { jornada, jornadaProducto, movimiento, producto, puntoVenta } from "@/db/schema";
import type { Estado } from "@/lib/errores";
import { esFechaValida, hoy } from "@/lib/fechas";
import {
  ErrorInventario,
  bloquearInventario,
  existencias,
  jornadaAbierta,
  leerCantidad,
  manillasEnPuntos,
  totalEnPuntos,
} from "@/lib/inventario";
import { requireAdmin, requireSession } from "@/lib/session";

const error = (mensaje: string): Estado => ({ ok: false, mensaje });

function revalidarInventario() {
  revalidatePath("/inventario");
  revalidatePath("/jornada", "layout");
  revalidatePath("/movimientos");
  revalidatePath("/reporte-ventas");
}

async function validar(puntoVentaId: number, fecha: string) {
  if (!esFechaValida(fecha)) return "La fecha no es válida.";
  if (fecha > hoy()) return "No se pueden registrar jornadas de días futuros.";
  const [punto] = await getDb().select({ id: puntoVenta.id }).from(puntoVenta).where(eq(puntoVenta.id, puntoVentaId));
  if (!punto) return "El punto de venta ya no existe.";
  return null;
}

// Entrega manillas de la bodega al punto. No cambia la existencia general.
export async function registrarEntrega(puntoVentaId: number, fecha: string, _estado: Estado, datos: FormData): Promise<Estado> {
  const { user } = await requireSession();
  const invalido = await validar(puntoVentaId, fecha);
  if (invalido) return error(invalido);

  const db = getDb();
  const productos = await db.select({ id: producto.id, nombre: producto.nombre }).from(producto);
  const lineas: { productoId: number; nombre: string; cantidad: number }[] = [];
  for (const p of productos) {
    if (!datos.has(`cantidad-${p.id}`)) continue;
    const cantidad = leerCantidad(datos.get(`cantidad-${p.id}`));
    if (cantidad === null) return error("Revisa las cantidades: deben ser números enteros.");
    if (cantidad > 0) lineas.push({ productoId: p.id, nombre: p.nombre, cantidad });
  }
  if (lineas.length === 0) return error("Escribe cuántas manillas se entregan de al menos un producto.");

  try {
    await db.transaction(async (tx) => {
      await bloquearInventario(tx);
      const existencia = await existencias(tx);
      const enPuntos = totalEnPuntos(await manillasEnPuntos(tx));
      for (const l of lineas) {
        const bodega = (existencia.get(l.productoId) ?? 0) - (enPuntos.get(l.productoId) ?? 0);
        if (l.cantidad > bodega) throw new ErrorInventario(`En bodega solo hay ${Math.max(bodega, 0)} manillas de ${l.nombre}.`);
      }

      const j = await jornadaAbierta(tx, puntoVentaId, fecha);
      const yaTiene = new Set(j.filas.map((f) => f.productoId));
      for (const l of lineas) {
        if (yaTiene.has(l.productoId)) {
          const [fila] = await tx
            .select({ recibidas: jornadaProducto.recibidas })
            .from(jornadaProducto)
            .where(and(eq(jornadaProducto.jornadaId, j.id), eq(jornadaProducto.productoId, l.productoId)));
          await tx
            .update(jornadaProducto)
            .set({ recibidas: fila.recibidas + l.cantidad })
            .where(and(eq(jornadaProducto.jornadaId, j.id), eq(jornadaProducto.productoId, l.productoId)));
        } else {
          await tx.insert(jornadaProducto).values({ jornadaId: j.id, productoId: l.productoId, recibidas: l.cantidad });
        }
      }
      await tx.insert(movimiento).values(
        lineas.map((l) => ({
          fecha,
          tipo: "entrega" as const,
          productoId: l.productoId,
          puntoVentaId,
          jornadaId: j.id,
          cantidad: l.cantidad,
          cambio: 0,
          usuario: user.name,
        })),
      );
    });
  } catch (e) {
    if (e instanceof ErrorInventario) return error(e.message);
    throw e;
  }

  revalidarInventario();
  redirect(`/jornada?fecha=${fecha}`);
}

// Cierra la jornada: guarda lo que quedó y descuenta las vendidas del inventario general.
export async function cerrarJornada(puntoVentaId: number, fecha: string, _estado: Estado, datos: FormData): Promise<Estado> {
  const { user } = await requireSession();
  const invalido = await validar(puntoVentaId, fecha);
  if (invalido) return error(invalido);

  const db = getDb();
  const nombres = new Map((await db.select({ id: producto.id, nombre: producto.nombre }).from(producto)).map((p) => [p.id, p.nombre]));

  try {
    await db.transaction(async (tx) => {
      await bloquearInventario(tx);
      const j = await jornadaAbierta(tx, puntoVentaId, fecha);
      const ventas = [];
      for (const f of j.filas) {
        const inicial = f.anterior + f.recibidas;
        if (inicial === 0) continue;
        const nombre = nombres.get(f.productoId) ?? "el producto";
        if (String(datos.get(`final-${f.productoId}`) ?? "").trim() === "") {
          throw new ErrorInventario(`Falta escribir cuántas quedaron de ${nombre}.`);
        }
        const final = leerCantidad(datos.get(`final-${f.productoId}`));
        if (final === null) throw new ErrorInventario(`La cantidad de ${nombre} debe ser un número entero.`);
        if (final > inicial) throw new ErrorInventario(`De ${nombre} quedaron ${final}, pero el punto solo tenía ${inicial}.`);
        await tx
          .update(jornadaProducto)
          .set({ final })
          .where(and(eq(jornadaProducto.jornadaId, j.id), eq(jornadaProducto.productoId, f.productoId)));
        if (inicial - final > 0) {
          ventas.push({
            fecha,
            tipo: "venta" as const,
            productoId: f.productoId,
            puntoVentaId,
            jornadaId: j.id,
            cantidad: inicial - final,
            cambio: -(inicial - final),
            inicial,
            quedaron: final,
            usuario: user.name,
          });
        }
      }
      // Las filas sin manillas quedan en 0 para que la jornada siguiente empiece en 0.
      await tx
        .update(jornadaProducto)
        .set({ final: 0 })
        .where(and(eq(jornadaProducto.jornadaId, j.id), eq(jornadaProducto.anterior, 0), eq(jornadaProducto.recibidas, 0)));
      if (ventas.length > 0) await tx.insert(movimiento).values(ventas);
      await tx.update(jornada).set({ cerrada: true, cerradaEn: new Date(), cerradaPor: user.name }).where(eq(jornada.id, j.id));
    });
  } catch (e) {
    if (e instanceof ErrorInventario) return error(e.message);
    throw e;
  }

  revalidarInventario();
  redirect(`/jornada?fecha=${fecha}`);
}

// Deshace un cierre: borra sus ventas y deja la jornada abierta otra vez.
// Solo se puede si el punto no tiene jornadas posteriores. Solo administradores.
export async function reabrirJornada(jornadaId: number): Promise<Estado> {
  await requireAdmin();
  const db = getDb();
  const resultado = await db.transaction(async (tx) => {
    await bloquearInventario(tx);
    const [j] = await tx.select().from(jornada).where(eq(jornada.id, jornadaId));
    if (!j) return error("La jornada ya no existe.");
    if (!j.cerrada) return error("La jornada ya está abierta.");
    const [posterior] = await tx
      .select({ id: jornada.id })
      .from(jornada)
      .where(and(eq(jornada.puntoVentaId, j.puntoVentaId), gt(jornada.fecha, j.fecha)))
      .limit(1);
    if (posterior) return error("No se puede reabrir: el punto ya tiene jornadas de días posteriores.");
    await tx.delete(movimiento).where(and(eq(movimiento.jornadaId, j.id), eq(movimiento.tipo, "venta")));
    await tx.update(jornadaProducto).set({ final: null }).where(eq(jornadaProducto.jornadaId, j.id));
    await tx.update(jornada).set({ cerrada: false, cerradaEn: null, cerradaPor: null }).where(eq(jornada.id, j.id));
    return { ok: true, mensaje: "Jornada reabierta. Corrige las cantidades y ciérrala de nuevo." };
  });
  if (resultado?.ok) revalidarInventario();
  return resultado;
}
