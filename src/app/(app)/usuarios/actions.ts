"use server";

// Acciones de la administración de usuarios. Cada una comprueba que
// quien la ejecuta sea administrador, porque cualquiera podría llamarlas.
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { mensajeDeError, type Estado } from "@/lib/errores";
import { requireAdmin } from "@/lib/session";

type Rol = "admin" | "user";

function texto(datos: FormData, campo: string) {
  return String(datos.get(campo) ?? "").trim();
}

export async function crearUsuario(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  try {
    await auth.api.createUser({
      body: {
        name: texto(datos, "name"),
        email: texto(datos, "email"),
        password: String(datos.get("password")),
        role: texto(datos, "role") as Rol,
      },
      headers: await headers(),
    });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function actualizarDatos(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  try {
    await auth.api.adminUpdateUser({
      body: {
        userId: texto(datos, "userId"),
        data: { name: texto(datos, "name"), email: texto(datos, "email").toLowerCase() },
      },
      headers: await headers(),
    });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  revalidatePath("/usuarios");
  return { ok: true, mensaje: "Datos guardados." };
}

export async function cambiarRol(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user } = await requireAdmin();
  const userId = texto(datos, "userId");
  if (userId === user.id) {
    return { ok: false, mensaje: "No puedes cambiar tu propio rol." };
  }
  try {
    await auth.api.setRole({
      body: { userId, role: texto(datos, "role") as Rol },
      headers: await headers(),
    });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  revalidatePath("/usuarios");
  return { ok: true, mensaje: "Rol actualizado." };
}

export async function cambiarContrasena(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireAdmin();
  const nueva = String(datos.get("password"));
  if (nueva.length < 8) {
    return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
  }
  try {
    await auth.api.setUserPassword({
      body: { userId: texto(datos, "userId"), newPassword: nueva },
      headers: await headers(),
    });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  return { ok: true, mensaje: "Contraseña cambiada." };
}

export async function cambiarBloqueo(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user } = await requireAdmin();
  const userId = texto(datos, "userId");
  const bloquear = texto(datos, "bloquear") === "si";
  if (userId === user.id) {
    return { ok: false, mensaje: "No puedes bloquearte a ti mismo." };
  }
  try {
    if (bloquear) {
      // Bloquear también cierra todas sus sesiones abiertas.
      await auth.api.banUser({ body: { userId }, headers: await headers() });
    } else {
      await auth.api.unbanUser({ body: { userId }, headers: await headers() });
    }
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  revalidatePath("/usuarios");
  return { ok: true, mensaje: bloquear ? "Usuario bloqueado." : "Usuario desbloqueado." };
}

export async function eliminarUsuario(_estado: Estado, datos: FormData): Promise<Estado> {
  const { user } = await requireAdmin();
  const userId = texto(datos, "userId");
  if (userId === user.id) {
    return { ok: false, mensaje: "No puedes eliminarte a ti mismo." };
  }
  try {
    await auth.api.removeUser({ body: { userId }, headers: await headers() });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  revalidatePath("/usuarios");
  redirect("/usuarios");
}
