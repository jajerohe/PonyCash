"use server";

// Acciones de la administración de usuarios. Cada una comprueba que
// quien la ejecuta sea administrador, porque cualquiera podría llamarlas.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { session, user } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { esDuplicado, mensajeDeError, type Estado } from "@/lib/errores";
import { requireAdmin } from "@/lib/session";

function texto(datos: FormData, campo: string) {
  return String(datos.get(campo) ?? "").trim();
}

// Crea un usuario (sin id) o guarda los cambios de uno existente.
// Al editar, la contraseña es opcional: si se deja vacía no se cambia.
export async function guardarUsuario(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user: yo } = await requireAdmin();
  const id = texto(datos, "id");
  const name = texto(datos, "name");
  const email = texto(datos, "email").toLowerCase();
  const password = String(datos.get("password") ?? "");
  const role = texto(datos, "role") === "admin" ? "admin" : "user";
  if (!name || !email.includes("@")) return { ok: false, mensaje: "Revisa el nombre y el correo." };
  if ((!id || password) && password.length < 8) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (!id) {
    try {
      // Sin "headers": la llamada la hace el servidor, después de comprobar arriba que es administrador.
      await getAuth().api.createUser({ body: { name, email, password, role } });
    } catch (error) {
      return { ok: false, mensaje: mensajeDeError(error) };
    }
    revalidatePath("/usuarios");
    return { ok: true, mensaje: `Usuario "${name}" creado.` };
  }

  try {
    // Nadie puede cambiar su propio rol: así siempre queda al menos un administrador.
    const cambios = id === yo.id ? { name, email } : { name, email, role };
    await getDb().update(user).set(cambios).where(eq(user.id, id));
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe un usuario con ese correo." };
    throw error;
  }
  if (password) {
    const ctx = await getAuth().$context;
    await ctx.internalAdapter.updatePassword(id, await ctx.password.hash(password));
  }
  revalidatePath("/usuarios");
  return { ok: true, mensaje: `Usuario "${name}" guardado.` };
}

// Bloquea o desbloquea. Un usuario bloqueado no puede iniciar sesión.
export async function cambiarBloqueo(id: string): Promise<Estado> {
  const { user: yo } = await requireAdmin();
  if (id === yo.id) return { ok: false, mensaje: "No puedes bloquearte a ti mismo." };

  const db = getDb();
  const [actual] = await db.select({ banned: user.banned }).from(user).where(eq(user.id, id));
  if (!actual) return { ok: false, mensaje: "El usuario no existe." };
  const bloquear = !actual.banned;
  await db.update(user).set({ banned: bloquear, banReason: null, banExpires: null }).where(eq(user.id, id));
  // Bloquear también cierra todas sus sesiones abiertas.
  if (bloquear) await db.delete(session).where(eq(session.userId, id));

  revalidatePath("/usuarios");
  return { ok: true, mensaje: bloquear ? "Usuario bloqueado." : "Usuario desbloqueado." };
}

export async function eliminarUsuario(id: string): Promise<Estado> {
  const { user: yo } = await requireAdmin();
  if (id === yo.id) return { ok: false, mensaje: "No puedes eliminarte a ti mismo." };

  // Sus sesiones y su cuenta se borran solas (ON DELETE CASCADE).
  await getDb().delete(user).where(eq(user.id, id));
  revalidatePath("/usuarios");
  return { ok: true, mensaje: "Usuario eliminado." };
}
