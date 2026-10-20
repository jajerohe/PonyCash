"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { mensajeDeError, type Estado } from "@/lib/errores";
import { requireSession } from "@/lib/session";

// Cualquier persona con sesión puede cambiar su propia contraseña:
// debe escribir la actual y la nueva dos veces.
export async function cambiarMiContrasena(_estado: Estado, datos: FormData): Promise<Estado> {
  await requireSession();
  const actual = String(datos.get("actual") ?? "");
  const nueva = String(datos.get("nueva") ?? "");
  if (nueva.length < 8) return { ok: false, mensaje: "La nueva contraseña debe tener al menos 8 caracteres." };
  if (nueva !== String(datos.get("confirmar") ?? "")) {
    return { ok: false, mensaje: "La nueva contraseña y su confirmación no coinciden." };
  }
  if (nueva === actual) return { ok: false, mensaje: "La nueva contraseña debe ser distinta de la actual." };

  try {
    // Cierra las sesiones abiertas en otros equipos; esta sigue activa.
    await getAuth().api.changePassword({
      body: { currentPassword: actual, newPassword: nueva, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  // Se recarga la página para que tome la sesión nueva que creó el cambio.
  redirect("/mi-cuenta?cambiada=1");
}
