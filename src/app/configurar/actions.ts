"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hayUsuarios } from "@/lib/configuracion";
import { mensajeDeError, type Estado } from "@/lib/errores";

// Crea el primer administrador e inicia su sesión.
// Solo funciona mientras la base de datos no tenga ningún usuario.
export async function crearPrimerAdmin(_estado: Estado, datos: FormData): Promise<Estado> {
  if (await hayUsuarios()) redirect("/login");

  const name = String(datos.get("name") ?? "").trim();
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  const password = String(datos.get("password"));
  if (password !== String(datos.get("confirmar"))) {
    return { ok: false, mensaje: "Las contraseñas no coinciden." };
  }

  try {
    await auth.api.createUser({ body: { name, email, password, role: "admin" } });
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  redirect("/");
}
