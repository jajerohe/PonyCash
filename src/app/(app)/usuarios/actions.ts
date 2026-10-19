"use server";

// Acciones de la administración de usuarios. Cada una revisa el permiso del
// perfil de quien la ejecuta, porque cualquiera podría llamarlas.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { perfil, session, user } from "@/db/schema";
import { getAcceso, requirePermiso } from "@/lib/accesos";
import { getAuth } from "@/lib/auth";
import { mensajeDeError, type Estado } from "@/lib/errores";

function texto(datos: FormData, campo: string) {
  return String(datos.get(campo) ?? "").trim();
}

// Código de PostgreSQL cuando se repite un valor que debe ser único.
function esDuplicado(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "23505";
}

async function buscarPerfil(id: number) {
  const [fila] = await getDb().select().from(perfil).where(eq(perfil.id, id));
  return fila;
}

// Usuario sobre el que se va a actuar. Solo un administrador puede modificar
// a otro administrador, para que nadie se suba de nivel por esa vía.
async function objetivo(
  datos: FormData,
): Promise<{ error: string } | { error: null; userId: string; esYo: boolean }> {
  const acceso = await getAcceso();
  const userId = texto(datos, "userId");
  const [fila] = await getDb()
    .select({ id: user.id, esAdministrador: perfil.esAdministrador })
    .from(user)
    .leftJoin(perfil, eq(user.perfilId, perfil.id))
    .where(eq(user.id, userId));
  if (!fila) return { error: "El usuario no existe." };
  if (fila.esAdministrador && !acceso.esAdministrador) {
    return { error: "Solo un administrador puede modificar a otro administrador." };
  }
  return { error: null, userId, esYo: userId === acceso.session.user.id };
}

export async function crearUsuario(_estado: Estado, datos: FormData): Promise<Estado> {
  const acceso = await requirePermiso("usuarios.crear");
  const elegido = await buscarPerfil(Number(texto(datos, "perfilId")));
  if (!elegido) return { ok: false, mensaje: "Elige un perfil." };
  if (elegido.esAdministrador && !acceso.esAdministrador) {
    return { ok: false, mensaje: "Solo un administrador puede crear administradores." };
  }

  try {
    // Sin "headers": la llamada la hace el servidor, después de revisar los permisos arriba.
    const { user: nuevo } = await getAuth().api.createUser({
      body: {
        name: texto(datos, "name"),
        email: texto(datos, "email"),
        password: String(datos.get("password")),
        role: elegido.esAdministrador ? "admin" : "user",
      },
    });
    await getDb().update(user).set({ perfilId: elegido.id }).where(eq(user.id, nuevo.id));
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function actualizarDatos(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("usuarios.editar");
  const o = await objetivo(datos);
  if (o.error !== null) return { ok: false, mensaje: o.error };

  const name = texto(datos, "name");
  const email = texto(datos, "email").toLowerCase();
  if (!name || !email.includes("@")) return { ok: false, mensaje: "Revisa el nombre y el correo." };
  try {
    await getDb().update(user).set({ name, email }).where(eq(user.id, o.userId));
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe un usuario con ese correo." };
    throw error;
  }
  revalidatePath("/usuarios");
  return { ok: true, mensaje: "Datos guardados." };
}

export async function cambiarPerfil(_estado: Estado, datos: FormData): Promise<Estado> {
  const acceso = await requirePermiso("usuarios.perfil");
  const o = await objetivo(datos);
  if (o.error !== null) return { ok: false, mensaje: o.error };
  if (o.esYo) return { ok: false, mensaje: "No puedes cambiar tu propio perfil." };

  const elegido = await buscarPerfil(Number(texto(datos, "perfilId")));
  if (!elegido) return { ok: false, mensaje: "Elige un perfil." };
  if (elegido.esAdministrador && !acceso.esAdministrador) {
    return { ok: false, mensaje: "Solo un administrador puede dar el perfil de administrador." };
  }

  // El rol de Better Auth acompaña al perfil: "admin" solo para el perfil de administrador.
  await getDb()
    .update(user)
    .set({ perfilId: elegido.id, role: elegido.esAdministrador ? "admin" : "user" })
    .where(eq(user.id, o.userId));
  revalidatePath("/usuarios");
  return { ok: true, mensaje: "Perfil actualizado." };
}

export async function cambiarContrasena(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("usuarios.contrasena");
  const o = await objetivo(datos);
  if (o.error !== null) return { ok: false, mensaje: o.error };

  const nueva = String(datos.get("password"));
  if (nueva.length < 8) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
  }
  const ctx = await getAuth().$context;
  await ctx.internalAdapter.updatePassword(o.userId, await ctx.password.hash(nueva));
  return { ok: true, mensaje: "Contraseña cambiada." };
}

export async function cambiarBloqueo(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("usuarios.bloquear");
  const o = await objetivo(datos);
  if (o.error !== null) return { ok: false, mensaje: o.error };
  if (o.esYo) return { ok: false, mensaje: "No puedes bloquearte a ti mismo." };

  const bloquear = texto(datos, "bloquear") === "si";
  const db = getDb();
  await db
    .update(user)
    .set({ banned: bloquear, banReason: null, banExpires: null })
    .where(eq(user.id, o.userId));
  // Bloquear también cierra todas sus sesiones abiertas.
  if (bloquear) await db.delete(session).where(eq(session.userId, o.userId));

  revalidatePath("/usuarios");
  return { ok: true, mensaje: bloquear ? "Usuario bloqueado." : "Usuario desbloqueado." };
}

export async function eliminarUsuario(_estado: Estado, datos: FormData): Promise<Estado> {
  await requirePermiso("usuarios.eliminar");
  const o = await objetivo(datos);
  if (o.error !== null) return { ok: false, mensaje: o.error };
  if (o.esYo) return { ok: false, mensaje: "No puedes eliminarte a ti mismo." };

  // Sus sesiones y su cuenta se borran solas (ON DELETE CASCADE).
  await getDb().delete(user).where(eq(user.id, o.userId));
  revalidatePath("/usuarios");
  redirect("/usuarios");
}
