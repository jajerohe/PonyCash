"use server";

// Acciones de la administración de usuarios. Cada una comprueba que
// quien la ejecuta sea administrador, porque cualquiera podría llamarlas.
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { session, user } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { mensajeDeError, type Estado } from "@/lib/errores";
import { requireAdmin } from "@/lib/session";

type Rol = "admin" | "user";

function texto(datos: FormData, campo: string) {
  return String(datos.get(campo) ?? "").trim();
}

function rol(datos: FormData): Rol {
  return texto(datos, "role") === "admin" ? "admin" : "user";
}

// Código de PostgreSQL cuando se repite un valor que debe ser único.
function esDuplicado(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "23505";
}

export async function crearUsuario(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  try {
    // Sin "headers": la llamada la hace el servidor, después de comprobar arriba que es administrador.
    await getAuth().api.createUser({
      body: {
        name: texto(datos, "name"),
        email: texto(datos, "email"),
        password: String(datos.get("password")),
        role: rol(datos),
      },
    });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function actualizarDatos(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const name = texto(datos, "name");
  const email = texto(datos, "email").toLowerCase();
  if (!name || !email.includes("@")) return { ok: false, mensaje: "Revisa el nombre y el correo." };
  try {
    await getDb().update(user).set({ name, email }).where(eq(user.id, texto(datos, "userId")));
  } catch (error) {
    if (esDuplicado(error)) return { ok: false, mensaje: "Ya existe un usuario con ese correo." };
    throw error;
  }
  revalidatePath("/usuarios");
  return { ok: true, mensaje: "Datos guardados." };
}

export async function cambiarRol(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user: yo } = await requireAdmin();
  const userId = texto(datos, "userId");
  if (userId === yo.id) return { ok: false, mensaje: "No puedes cambiar tu propio rol." };
  await getDb().update(user).set({ role: rol(datos) }).where(eq(user.id, userId));
  revalidatePath("/usuarios");
  return { ok: true, mensaje: "Rol actualizado." };
}

export async function cambiarContrasena(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const nueva = String(datos.get("password"));
  if (nueva.length < 8) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
  }
  const ctx = await getAuth().$context;
  await ctx.internalAdapter.updatePassword(texto(datos, "userId"), await ctx.password.hash(nueva));
  return { ok: true, mensaje: "Contraseña cambiada." };
}

export async function cambiarBloqueo(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user: yo } = await requireAdmin();
  const userId = texto(datos, "userId");
  if (userId === yo.id) return { ok: false, mensaje: "No puedes bloquearte a ti mismo." };

  const bloquear = texto(datos, "bloquear") === "si";
  const db = getDb();
  await db.update(user).set({ banned: bloquear, banReason: null, banExpires: null }).where(eq(user.id, userId));
  // Bloquear también cierra todas sus sesiones abiertas.
  if (bloquear) await db.delete(session).where(eq(session.userId, userId));

  revalidatePath("/usuarios");
  return { ok: true, mensaje: bloquear ? "Usuario bloqueado." : "Usuario desbloqueado." };
}

export async function eliminarUsuario(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user: yo } = await requireAdmin();
  const userId = texto(datos, "userId");
  if (userId === yo.id) return { ok: false, mensaje: "No puedes eliminarte a ti mismo." };

  // Sus sesiones y su cuenta se borran solas (ON DELETE CASCADE).
  await getDb().delete(user).where(eq(user.id, userId));
  revalidatePath("/usuarios");
  redirect("/usuarios");
}
