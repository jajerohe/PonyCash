import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

// Dirección pública de la app. En Vercel se toma sola del dominio de producción.
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const auth = betterAuth({
  baseURL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Nadie puede registrarse solo: los usuarios los crea un administrador.
    disableSignUp: true,
    minPasswordLength: 8,
  },
  plugins: [
    // Roles "admin" y "user", y gestión de usuarios
    admin({ bannedUserMessage: "Tu usuario está bloqueado. Habla con un administrador." }),
    nextCookies(), // permite iniciar/cerrar sesión desde Server Actions
  ],
});
