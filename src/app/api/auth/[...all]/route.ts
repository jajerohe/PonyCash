import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// Todas las rutas /api/auth/* (iniciar sesión, cerrar sesión, etc.) las atiende Better Auth.
export function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
