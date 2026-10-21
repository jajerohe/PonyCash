"use server";

// Carga de tarifas desde un archivo de Excel. El navegador lee el archivo y
// envía las filas como texto; aquí se revisan todas contra la base de datos
// y solo se guardan si ninguna tiene errores.
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { producto, tarifa, tipoTarifa } from "@/db/schema";
import type { Estado } from "@/lib/errores";
import { esFechaValida } from "@/lib/fechas";
import { requireAdmin } from "@/lib/session";
import { normalizar } from "@/lib/texto";

export type FilaArchivo = {
  fila: number; // Número de fila en Excel, para los mensajes
  producto: string;
  tipo: string;
  valor: string;
  desde: string;
  hasta: string;
};

export type FilaRevisada = {
  fila: number;
  producto: string;
  tipo: string;
  valor: number | null;
  desde: string;
  hasta: string;
  accion: "nueva" | "actualiza" | "error";
  mensaje: string;
};

export type Revision = { filas: FilaRevisada[]; nuevas: number; actualizadas: number; errores: number };

const MAXIMO_FILAS = 500;

// "15.000", "$ 15000" o 15000 → 15000. Devuelve null si no es un valor válido.
function leerValor(texto: string) {
  const limpio = texto.replace(/[$\s.,]/g, "");
  if (!/^\d{1,10}$/.test(limpio)) return null;
  const valor = Number(limpio);
  return valor <= 2_000_000_000 ? valor : null;
}

// "2026-01-31", "31/01/2026" o "31-1-2026" → "2026-01-31". Devuelve null si no es una fecha.
function leerFecha(texto: string) {
  let anio, mes, dia;
  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const local = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (iso) [, anio, mes, dia] = iso;
  else if (local) [, dia, mes, anio] = local;
  else return null;
  const fecha = `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  return esFechaValida(fecha) ? fecha : null;
}

const seCruzan = (a: { desde: string; hasta: string }, b: { desde: string; hasta: string }) =>
  a.desde <= b.hasta && b.desde <= a.hasta;

// Revisa cada fila. Una fila de un producto y tipo que ya tiene tarifa activa
// con fechas que se cruzan actualiza esa tarifa solo si es la predeterminada
// del producto o si tiene exactamente las mismas fechas; si no, es un error.
async function analizar(entrada: unknown): Promise<Revision> {
  const filasArchivo = leerEntrada(entrada);
  const db = getDb();
  const [productos, tipos, existentes] = await Promise.all([
    db.select({ id: producto.id, nombre: producto.nombre, activa: producto.activa }).from(producto),
    db.select({ id: tipoTarifa.id, nombre: tipoTarifa.nombre, activa: tipoTarifa.activa }).from(tipoTarifa),
    db
      .select({
        id: tarifa.id,
        productoId: tarifa.productoId,
        tipoTarifaId: tarifa.tipoTarifaId,
        desde: tarifa.desde,
        hasta: tarifa.hasta,
        predeterminada: tarifa.predeterminada,
      })
      .from(tarifa)
      .where(eq(tarifa.activa, true)),
  ]);
  const productoPorNombre = new Map(productos.map((m) => [normalizar(m.nombre.trim()), m]));
  const tipoPorNombre = new Map(tipos.map((t) => [normalizar(t.nombre.trim()), t]));

  // Lo que ya aceptaron las filas anteriores del archivo.
  const aceptadas: { fila: number; productoId: number; tipoTarifaId: number; desde: string; hasta: string }[] = [];
  const actualizadas = new Map<number, number>(); // id de tarifa → fila que la actualiza

  const filas: FilaRevisada[] = filasArchivo.map((f) => {
    const base = { fila: f.fila, producto: f.producto, tipo: f.tipo, desde: f.desde, hasta: f.hasta };
    const valor = leerValor(f.valor);
    const error = (mensaje: string): FilaRevisada => ({ ...base, valor, accion: "error", mensaje });

    const m = productoPorNombre.get(normalizar(f.producto.trim()));
    const t = tipoPorNombre.get(normalizar(f.tipo.trim()));
    const desde = leerFecha(f.desde.trim());
    const hasta = leerFecha(f.hasta.trim());
    if (!f.producto.trim()) return error("Falta el producto.");
    if (!m) return error(`No existe el producto "${f.producto}".`);
    if (!m.activa) return error(`El producto "${m.nombre}" está inactivo.`);
    if (!f.tipo.trim()) return error("Falta el tipo de tarifa.");
    if (!t) return error(`No existe el tipo de tarifa "${f.tipo}".`);
    if (!t.activa) return error(`El tipo de tarifa "${t.nombre}" está inactivo.`);
    if (valor === null) return error("Valor inválido: escribe pesos sin centavos (por ejemplo 15000).");
    if (!desde) return error("Fecha desde inválida (usa DD/MM/AAAA).");
    if (!hasta) return error("Fecha hasta inválida (usa DD/MM/AAAA).");
    if (hasta < desde) return error("La fecha hasta es anterior a la fecha desde.");

    const datos = { productoId: m.id, tipoTarifaId: t.id, desde, hasta };
    const nombres = { ...base, producto: m.nombre, tipo: t.nombre, desde, hasta, valor };

    const repetida = aceptadas.find(
      (a) => a.productoId === m.id && a.tipoTarifaId === t.id && seCruzan(a, datos),
    );
    if (repetida) return { ...nombres, accion: "error", mensaje: `Se cruza con la fila ${repetida.fila} del archivo.` };

    const cruces = existentes.filter(
      (e) => e.productoId === m.id && e.tipoTarifaId === t.id && seCruzan(e, datos),
    );
    let accion: FilaRevisada["accion"] = "nueva";
    let mensaje = "Tarifa nueva.";
    if (cruces.length > 0) {
      const [objetivo] = cruces;
      const mismasFechas = objetivo.desde === desde && objetivo.hasta === hasta;
      if (cruces.length > 1 || !(objetivo.predeterminada || mismasFechas)) {
        return {
          ...nombres,
          accion: "error",
          mensaje: "Ya hay una tarifa activa de ese tipo para el producto con fechas que se cruzan.",
        };
      }
      if (actualizadas.has(objetivo.id)) {
        return { ...nombres, accion: "error", mensaje: `La fila ${actualizadas.get(objetivo.id)} ya actualiza esa tarifa.` };
      }
      actualizadas.set(objetivo.id, f.fila);
      accion = "actualiza";
      mensaje = objetivo.predeterminada
        ? "Actualiza la tarifa predeterminada del producto."
        : "Actualiza el valor de la tarifa con esas mismas fechas.";
    }
    aceptadas.push({ fila: f.fila, ...datos });
    return { ...nombres, accion, mensaje };
  });

  return {
    filas,
    nuevas: filas.filter((f) => f.accion === "nueva").length,
    actualizadas: filas.filter((f) => f.accion === "actualiza").length,
    errores: filas.filter((f) => f.accion === "error").length,
  };
}

// Valida la forma de lo que manda el navegador (nunca confiar en él).
function leerEntrada(entrada: unknown): FilaArchivo[] {
  if (!Array.isArray(entrada)) throw new Error("Datos de carga inválidos.");
  if (entrada.length > MAXIMO_FILAS) throw new Error(`El archivo tiene más de ${MAXIMO_FILAS} filas.`);
  return entrada.map((f, i) => {
    const o = (f ?? {}) as Record<string, unknown>;
    const texto = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v).slice(0, 200) : "");
    return {
      fila: Number.isInteger(o.fila) ? (o.fila as number) : i + 2,
      producto: texto(o.producto),
      tipo: texto(o.tipo),
      valor: texto(o.valor),
      desde: texto(o.desde),
      hasta: texto(o.hasta),
    };
  });
}

export async function revisarCarga(filas: FilaArchivo[]): Promise<Revision | { error: string }> {
  await requireAdmin();
  if (filas.length > MAXIMO_FILAS) return { error: `El archivo tiene más de ${MAXIMO_FILAS} filas.` };
  return analizar(filas);
}

export async function confirmarCarga(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  let entrada: unknown;
  try {
    entrada = JSON.parse(String(datos.get("filas") ?? "[]"));
  } catch {
    return { ok: false, mensaje: "No se pudieron leer las filas del archivo." };
  }
  if (!Array.isArray(entrada) || entrada.length === 0) return { ok: false, mensaje: "El archivo no tiene filas." };
  if (entrada.length > MAXIMO_FILAS) return { ok: false, mensaje: `El archivo tiene más de ${MAXIMO_FILAS} filas.` };

  // Se revisa otra vez: los datos pudieron cambiar desde la vista previa.
  const revision = await analizar(entrada);
  if (revision.errores > 0) {
    return { ok: false, mensaje: `Hay ${revision.errores} fila(s) con errores. Corrígelas en el archivo y vuelve a cargarlo.` };
  }

  // Ids de productos y tipos ya validados, por nombre.
  const db = getDb();
  const nombresProducto = [...new Set(revision.filas.map((f) => f.producto))];
  const nombresTipo = [...new Set(revision.filas.map((f) => f.tipo))];
  const [productos, tipos, existentes] = await Promise.all([
    db.select({ id: producto.id, nombre: producto.nombre }).from(producto).where(inArray(producto.nombre, nombresProducto)),
    db.select({ id: tipoTarifa.id, nombre: tipoTarifa.nombre }).from(tipoTarifa).where(inArray(tipoTarifa.nombre, nombresTipo)),
    db.select().from(tarifa).where(eq(tarifa.activa, true)),
  ]);
  const idProducto = new Map(productos.map((m) => [m.nombre, m.id]));
  const idTipo = new Map(tipos.map((t) => [t.nombre, t.id]));

  await db.transaction(async (tx) => {
    const nuevas = [];
    for (const f of revision.filas) {
      const productoId = idProducto.get(f.producto)!;
      const tipoTarifaId = idTipo.get(f.tipo)!;
      const valores = { productoId, tipoTarifaId, valor: f.valor!, desde: f.desde, hasta: f.hasta };
      if (f.accion === "nueva") {
        nuevas.push(valores);
      } else {
        const objetivo = existentes.find(
          (e) => e.productoId === productoId && e.tipoTarifaId === tipoTarifaId && seCruzan(e, f),
        )!;
        await tx
          .update(tarifa)
          .set({ valor: valores.valor, desde: f.desde, hasta: f.hasta })
          .where(eq(tarifa.id, objetivo.id));
      }
    }
    if (nuevas.length > 0) await tx.insert(tarifa).values(nuevas);
  });

  revalidatePath("/tarifas");
  const partes = [
    revision.nuevas && `${revision.nuevas} tarifa(s) nueva(s)`,
    revision.actualizadas && `${revision.actualizadas} actualizada(s)`,
  ].filter(Boolean);
  return { ok: true, mensaje: `Carga completa: ${partes.join(" y ")}.` };
}
