// Cálculos del inventario. La existencia general de un producto es la suma de
// los "cambio" de sus movimientos. Lo que tiene un punto de venta sale de su
// última jornada: si está cerrada, lo que quedó; si no, anterior + recibidas.
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { jornada, jornadaProducto, movimiento } from "@/db/schema";
import { formatearFecha } from "./fechas";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Conexion = Db | Tx;

// Todas las acciones que cambian el inventario se hacen una tras otra, para
// que dos entregas al mismo tiempo no saquen de la bodega más de lo que hay.
export async function bloquearInventario(tx: Tx) {
  await tx.execute(sql`select pg_advisory_xact_lock(4207)`);
}

// Existencia general por producto.
export async function existencias(db: Conexion) {
  const filas = await db
    .select({ productoId: movimiento.productoId, total: sql<number>`coalesce(sum(${movimiento.cambio}), 0)::int` })
    .from(movimiento)
    .groupBy(movimiento.productoId);
  return new Map(filas.map((f) => [f.productoId, f.total]));
}

// Manillas que tiene cada punto de venta ahora: Map<puntoId, Map<productoId, cantidad>>.
export async function manillasEnPuntos(db: Conexion) {
  const ultimas = await db.execute<{ id: number; punto_venta_id: number; cerrada: boolean }>(sql`
    select distinct on (punto_venta_id) id, punto_venta_id, cerrada
    from jornada order by punto_venta_id, fecha desc
  `);
  const resultado = new Map<number, Map<number, number>>();
  if (ultimas.rows.length === 0) return resultado;
  const porJornada = new Map(ultimas.rows.map((j) => [j.id, j]));
  const filas = await db
    .select()
    .from(jornadaProducto)
    .where(inArray(jornadaProducto.jornadaId, [...porJornada.keys()]));
  for (const f of filas) {
    const j = porJornada.get(f.jornadaId)!;
    const cantidad = j.cerrada ? (f.final ?? 0) : f.anterior + f.recibidas;
    if (!resultado.has(j.punto_venta_id)) resultado.set(j.punto_venta_id, new Map());
    resultado.get(j.punto_venta_id)!.set(f.productoId, cantidad);
  }
  return resultado;
}

// Total de manillas de cada producto que están en los puntos de venta.
export function totalEnPuntos(enPuntos: Map<number, Map<number, number>>) {
  const total = new Map<number, number>();
  for (const productos of enPuntos.values()) {
    for (const [productoId, cantidad] of productos) total.set(productoId, (total.get(productoId) ?? 0) + cantidad);
  }
  return total;
}

export type FilaJornada = { productoId: number; anterior: number; recibidas: number; final: number | null };

export type EstadoJornada =
  | { tipo: "existe"; id: number; cerrada: boolean; cerradaEn: Date | null; cerradaPor: string | null; filas: FilaJornada[] }
  // Todavía no hay jornada ese día; se crearía con lo que le quedó en la anterior.
  | { tipo: "nueva"; filas: FilaJornada[] }
  // No se puede empezar: la jornada anterior sigue abierta.
  | { tipo: "pendiente"; fecha: string }
  // Ya hay jornadas después de esta fecha; no se puede crear una en medio.
  | { tipo: "posterior"; fecha: string };

// Cómo está la jornada de un punto en una fecha.
export async function estadoJornada(db: Conexion, puntoVentaId: number, fecha: string): Promise<EstadoJornada> {
  const [actual] = await db
    .select()
    .from(jornada)
    .where(and(eq(jornada.puntoVentaId, puntoVentaId), eq(jornada.fecha, fecha)));
  if (actual) {
    const filas = await db
      .select({
        productoId: jornadaProducto.productoId,
        anterior: jornadaProducto.anterior,
        recibidas: jornadaProducto.recibidas,
        final: jornadaProducto.final,
      })
      .from(jornadaProducto)
      .where(eq(jornadaProducto.jornadaId, actual.id));
    return { tipo: "existe", id: actual.id, cerrada: actual.cerrada, cerradaEn: actual.cerradaEn, cerradaPor: actual.cerradaPor, filas };
  }

  const [ultima] = await db
    .select()
    .from(jornada)
    .where(eq(jornada.puntoVentaId, puntoVentaId))
    .orderBy(desc(jornada.fecha))
    .limit(1);
  if (ultima && ultima.fecha > fecha) return { tipo: "posterior", fecha: ultima.fecha };
  if (ultima && !ultima.cerrada) return { tipo: "pendiente", fecha: ultima.fecha };

  const filas: FilaJornada[] = [];
  if (ultima) {
    const anteriores = await db.select().from(jornadaProducto).where(eq(jornadaProducto.jornadaId, ultima.id));
    for (const a of anteriores) {
      if (a.final) filas.push({ productoId: a.productoId, anterior: a.final, recibidas: 0, final: null });
    }
  }
  return { tipo: "nueva", filas };
}

// Error con un mensaje para mostrarle a la persona.
export class ErrorInventario extends Error {}

// Devuelve la jornada abierta del punto en la fecha, creándola si hace falta.
// Lanza ErrorInventario si no se puede.
export async function jornadaAbierta(tx: Tx, puntoVentaId: number, fecha: string) {
  const estado = await estadoJornada(tx, puntoVentaId, fecha);
  if (estado.tipo === "pendiente") throw new ErrorInventario(`Primero hay que cerrar la jornada del ${formatearFecha(estado.fecha)}.`);
  if (estado.tipo === "posterior") throw new ErrorInventario(`Este punto ya tiene una jornada del ${formatearFecha(estado.fecha)}; no se puede registrar una anterior.`);
  if (estado.tipo === "existe") {
    if (estado.cerrada) throw new ErrorInventario("La jornada de ese día ya está cerrada.");
    return { id: estado.id, filas: estado.filas };
  }
  const [nueva] = await tx.insert(jornada).values({ puntoVentaId, fecha }).returning({ id: jornada.id });
  if (estado.filas.length > 0) {
    await tx.insert(jornadaProducto).values(estado.filas.map((f) => ({ jornadaId: nueva.id, productoId: f.productoId, anterior: f.anterior })));
  }
  return { id: nueva.id, filas: estado.filas };
}

// Existencia de un producto antes de una fecha (para el saldo inicial de los movimientos).
export async function existenciaAntesDe(db: Conexion, productoId: number, fecha: string) {
  const [fila] = await db
    .select({ total: sql<number>`coalesce(sum(${movimiento.cambio}), 0)::int` })
    .from(movimiento)
    .where(and(eq(movimiento.productoId, productoId), lt(movimiento.fecha, fecha)));
  return fila?.total ?? 0;
}

// Lee un entero >= 0 de un campo del formulario ("" cuenta como 0). null si no es válido.
export function leerCantidad(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").replace(/[\s.]/g, "");
  if (texto === "") return 0;
  if (!/^\d{1,7}$/.test(texto)) return null;
  return Number(texto);
}
