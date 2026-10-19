"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { perfil, user } from "@/db/schema";
import { getAuth } from "@/lib/auth";
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
    const { user: nuevo } = await getAuth().api.createUser({
      body: { name, email, password, role: "admin" },
    });
    // El primer usuario recibe el perfil de administrador (se crea si no existe).
    const db = getDb();
    let [admin] = await db.select().from(perfil).where(eq(perfil.esAdministrador, true)).limit(1);
    if (!admin) {
      [admin] = await db
        .insert(perfil)
        .values({ nombre: "Administrador", descripcion: "Acceso total al sistema", esAdministrador: true })
        .returning();
    }
    await db.update(user).set({ perfilId: admin.id }).where(eq(user.id, nuevo.id));
    await getAuth().api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  redirect("/");
}
