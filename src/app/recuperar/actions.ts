"use server";

import { and, eq, gt, like } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { user, verification } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { correoConfigurado, enviarCorreo } from "@/lib/correo";
import { mensajeDeError, type Estado } from "@/lib/errores";

const VIGENCIA_MINUTOS = 60;
const ESPERA_ENTRE_CORREOS_MINUTOS = 2;

// Dirección pública de la app, tomada de la visita actual.
async function origen() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocolo = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

function textoAleatorio() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Envía un enlace para crear una contraseña nueva. Por seguridad la respuesta
// es la misma exista o no el correo, para no revelar quién tiene cuenta.
export async function solicitarRecuperacion(_estado: Estado, datos: FormData): Promise<Estado> {
  const email = String(datos.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { ok: false, mensaje: "Escribe un correo válido." };
  if (!correoConfigurado()) {
    return {
      ok: false,
      mensaje: "La recuperación por correo todavía no está configurada. Pide a un administrador que te asigne una contraseña nueva.",
    };
  }
  const respuesta = {
    ok: true,
    mensaje: `Si ${email} está registrado, te enviamos un enlace para crear una contraseña nueva. Revisa también la carpeta de spam. El enlace vence en ${VIGENCIA_MINUTOS} minutos.`,
  };

  const db = getDb();
  const [cuenta] = await db.select().from(user).where(eq(user.email, email));
  if (!cuenta || cuenta.banned) return respuesta;

  // Evita mandar muchos correos seguidos a la misma persona.
  const desde = new Date(Date.now() - ESPERA_ENTRE_CORREOS_MINUTOS * 60_000);
  const [reciente] = await db
    .select({ id: verification.id })
    .from(verification)
    .where(
      and(
        eq(verification.value, cuenta.id),
        like(verification.identifier, "reset-password:%"),
        gt(verification.createdAt, desde),
      ),
    )
    .limit(1);
  if (reciente) return respuesta;

  // Mismo formato que usa Better Auth, para validarlo luego con resetPassword.
  const token = textoAleatorio();
  const ctx = await getAuth().$context;
  await ctx.internalAdapter.createVerificationValue({
    value: cuenta.id,
    identifier: `reset-password:${token}`,
    expiresAt: new Date(Date.now() + VIGENCIA_MINUTOS * 60_000),
  });

  const enlace = `${await origen()}/restablecer?token=${token}`;
  try {
    await enviarCorreo({
      para: cuenta.email,
      asunto: "Recupera tu contraseña de PonyCash",
      texto: `Hola ${cuenta.name}:\n\nPara crear una contraseña nueva abre este enlace (vence en ${VIGENCIA_MINUTOS} minutos):\n${enlace}\n\nSi no lo pediste, ignora este correo; tu contraseña no cambia.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px">
  <h2 style="color:#7c3aed">PonyCash</h2>
  <p>Hola ${cuenta.name.replace(/</g, "&lt;")}:</p>
  <p>Para crear una contraseña nueva haz clic en el botón. El enlace vence en ${VIGENCIA_MINUTOS} minutos.</p>
  <p><a href="${enlace}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Crear contraseña nueva</a></p>
  <p style="color:#64748b;font-size:13px">Si no lo pediste, ignora este correo; tu contraseña no cambia.</p>
</div>`,
    });
  } catch (error) {
    console.error("No se pudo enviar el correo de recuperación:", error);
    return { ok: false, mensaje: "No pudimos enviar el correo. Intenta más tarde o pide ayuda a un administrador." };
  }
  // Solo en desarrollo, para poder probar sin correo real.
  if (process.env.NODE_ENV !== "production") console.log("Enlace de recuperación:", enlace);
  return respuesta;
}

export async function restablecerContrasena(_estado: Estado, datos: FormData): Promise<Estado> {
  const token = String(datos.get("token") ?? "");
  const nueva = String(datos.get("nueva") ?? "");
  if (nueva.length < 8) return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
  if (nueva !== String(datos.get("confirmar") ?? "")) {
    return { ok: false, mensaje: "Las contraseñas no coinciden." };
  }
  try {
    await getAuth().api.resetPassword({ body: { token, newPassword: nueva } });
  } catch (error) {
    return { ok: false, mensaje: mensajeDeError(error) };
  }
  redirect("/login?restablecida=1");
}
