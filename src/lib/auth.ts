import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { cache } from "react";
import { getDb } from "@/db";
import * as schema from "@/db/schema";

// Se crea una por visita porque usa la conexión a la base de datos de esa visita.
export const getAuth = cache(() =>
  betterAuth({
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
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
  }),
);
