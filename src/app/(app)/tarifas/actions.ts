"use server";

// Acciones de la configuración de tarifas. Solo para administradores.
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { categoria, manilla, tarifa, tipoTarifa } from "@/db/schema";
import type { Estado } from "@/lib/errores";
import { leerPesos } from "@/lib/pesos";
import { requireAdmin } from "@/lib/session";

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

// ---------- Manillas y sus valores ----------

export async function guardarManilla(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const id = entero(datos, "id"); // 0 = manilla nueva
  const nombre = texto(datos, "nombre");
  const categoriaId = entero(datos, "categoriaId");
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la manilla." };
  if (!categoriaId) return { ok: false, mensaje: "Elige una categoría." };

  // Un campo "valor_<id del tipo de tarifa>" por cada tipo; vacío = no aplica.
  const valores: { tipoTarifaId: number; valor: number }[] = [];
  const sinValor: number[] = [];
  for (const [campo, crudo] of datos.entries()) {
    if (!campo.startsWith("valor_")) continue;
    const tipoTarifaId = Number(campo.slice("valor_".length));
    const valor = leerPesos(String(crudo));
    if (valor === null) sinValor.push(tipoTarifaId);
    else if (Number.isNaN(valor)) {
      return { ok: false, mensaje: `"${crudo}" no es un valor válido. Escribe solo números, por ejemplo 25000.` };
    } else valores.push({ tipoTarifaId, valor });
  }
  if (valores.length === 0) return { ok: false, mensaje: "Escribe al menos un valor." };

  let manillaId = id;
  try {
    await getDb().transaction(async (tx) => {
      const datosManilla = {
        nombre,
        categoriaId,
        orden: entero(datos, "orden"),
        activa: datos.get("activa") === "on",
      };
      if (id) {
        await tx.update(manilla).set(datosManilla).where(eq(manilla.id, id));
      } else {
        [{ id: manillaId }] = await tx.insert(manilla).values(datosManilla).returning({ id: manilla.id });
      }
      if (sinValor.length) {
        await tx
          .delete(tarifa)
          .where(and(eq(tarifa.manillaId, manillaId), inArray(tarifa.tipoTarifaId, sinValor)));
      }
      for (const v of valores) {
        await tx
          .insert(tarifa)
          .values({ manillaId, ...v })
          .onConflictDoUpdate({
            target: [tarifa.manillaId, tarifa.tipoTarifaId],
            set: { valor: v.valor },
          });
      }
    });
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe una manilla con ese nombre en esa categoría." };
    throw error;
  }

  revalidatePath("/tarifas", "layout");
  if (!id) redirect("/tarifas");
  return { ok: true, mensaje: "Cambios guardados." };
}

export async function eliminarManilla(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  // Sus tarifas se borran solas (ON DELETE CASCADE).
  await getDb().delete(manilla).where(eq(manilla.id, entero(datos, "id")));
  revalidatePath("/tarifas", "layout");
  redirect("/tarifas");
}

// ---------- Categorías y tipos de tarifa ----------
// Las dos listas funcionan igual, así que comparten estas acciones.

const catalogos = {
  categoria: { tabla: categoria, nombre: "categoría" },
  tipo: { tabla: tipoTarifa, nombre: "tipo de tarifa" },
};

function catalogo(datos: FormData) {
  return datos.get("catalogo") === "tipo" ? catalogos.tipo : catalogos.categoria;
}

export async function crearCatalogo(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const { tabla, nombre: queEs } = catalogo(datos);
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, mensaje: "Escribe un nombre." };
  try {
    await getDb().insert(tabla).values({ nombre, orden: entero(datos, "orden") });
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: `Ya existe un(a) ${queEs} con ese nombre.` };
    throw error;
  }
  revalidatePath("/tarifas", "layout");
  return { ok: true, mensaje: `"${nombre}" creado(a).` };
}

export async function actualizarCatalogo(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const { tabla, nombre: queEs } = catalogo(datos);
  const nombre = texto(datos, "nombre");
  if (!nombre) return { ok: false, mensaje: "Escribe un nombre." };
  try {
    await getDb()
      .update(tabla)
      .set({ nombre, orden: entero(datos, "orden"), activa: datos.get("activa") === "on" })
      .where(eq(tabla.id, entero(datos, "id")));
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: `Ya existe un(a) ${queEs} con ese nombre.` };
    throw error;
  }
  revalidatePath("/tarifas", "layout");
  return { ok: true, mensaje: "Guardado." };
}

export async function eliminarCatalogo(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const esTipo = datos.get("catalogo") === "tipo";
  const id = entero(datos, "id");
  const db = getDb();

  const [enUso] = esTipo
    ? await db.select({ id: tarifa.id }).from(tarifa).where(eq(tarifa.tipoTarifaId, id)).limit(1)
    : await db.select({ id: manilla.id }).from(manilla).where(eq(manilla.categoriaId, id)).limit(1);
  if (enUso) {
    return {
      ok: false,
      mensaje: esTipo
        ? "Hay manillas con valores de este tipo. Quítaselos primero o desmárcalo como activo."
        : "Tiene manillas. Muévelas o elimínalas primero, o desmárcala como activa.",
    };
  }

  if (esTipo) await db.delete(tipoTarifa).where(eq(tipoTarifa.id, id));
  else await db.delete(categoria).where(eq(categoria.id, id));
  revalidatePath("/tarifas", "layout");
  return { ok: true, mensaje: "Eliminado." };
}
