"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { mensajeDeError, type Estado } from "@/lib/errores";

export async function iniciarSesion(_estado: Estado, datos: FormData): Promise<Estado> {
  try {
    await auth.api.signInEmail({
      body: {
        email: String(datos.get("email")),
        password: String(datos.get("password")),
      },
      headers: await headers(),
    });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  redirect("/");
}

export async function cerrarSesion() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
