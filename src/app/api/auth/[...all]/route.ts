import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Todas las rutas /api/auth/* (iniciar sesión, cerrar sesión, etc.) las atiende Better Auth.
export const { GET, POST } = toNextJsHandler(auth);
