"use server";

// Acciones de Perfiles y accesos. Requieren el permiso "perfiles.gestionar".
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { perfil, perfilPermiso, user } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import type { Estado } from "@/lib/errores";
import { esPermiso } from "@/lib/permisos";

// Código de PostgreSQL cuando se repite un valor que debe ser único.
function esDuplicado(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "23505";
}

export async function guardarPerfil(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("perfiles.gestionar");
  const id = Number(datos.get("id")) || 0; // 0 = perfil nuevo
  const nombre = String(datos.get("nombre") ?? "").trim();
  const descripcion = String(datos.get("descripcion") ?? "").trim() || null;
  if (!nombre) return { ok: false, mensaje: "Escribe el nombre del perfil." };
  // Cada casilla marcada llega como name="permiso" value="modulo.opcion".
  const permisos = [...new Set(datos.getAll("permiso").map(String))].filter(esPermiso);

  const db = getDb();
  let perfilId = id;
  try {
    await db.transaction(async (tx) => {
      if (id) {
        const [actual] = await tx.select().from(perfil).where(eq(perfil.id, id));
        if (!actual) throw new Error("El perfil no existe.");
        await tx.update(perfil).set({ nombre, descripcion }).where(eq(perfil.id, id));
        // El perfil de administrador tiene todos los permisos: no se guardan casillas.
        if (actual.esAdministrador) return;
        await tx.delete(perfilPermiso).where(eq(perfilPermiso.perfilId, id));
      } else {
        [{ id: perfilId }] = await tx.insert(perfil).values({ nombre, descripcion }).returning({ id: perfil.id });
      }
      if (permisos.length) {
        await tx.insert(perfilPermiso).values(permisos.map((permiso) => ({ perfilId, permiso })));
      }
    });
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe un perfil con ese nombre." };
    throw error;
  }

  revalidatePath("/", "layout");
  if (!id) redirect(`/perfiles/${perfilId}`);
  return { ok: true, mensaje: "Perfil guardado." };
}

export async function eliminarPerfil(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("perfiles.gestionar");
  const id = Number(datos.get("id"));
  const db = getDb();

  const [actual] = await db.select().from(perfil).where(eq(perfil.id, id));
  if (!actual) return { ok: false, mensaje: "El perfil no existe." };
  if (actual.esAdministrador) return { ok: false, mensaje: "El perfil de administrador no se puede eliminar." };
  const [{ total }] = await db.select({ total: count() }).from(user).where(eq(user.perfilId, id));
  if (total > 0) {
    return { ok: false, mensaje: `Lo tienen ${total} usuario(s). Cámbiales el perfil antes de eliminarlo.` };
  }

  // Sus permisos se borran solos (ON DELETE CASCADE).
  await db.delete(perfil).where(eq(perfil.id, id));
  revalidatePath("/perfiles");
  redirect("/perfiles");
}
