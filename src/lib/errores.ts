import { isAPIError } from "better-auth/api";

// Traduce los errores de Better Auth a mensajes en español.
const MENSAJES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Correo o contraseña incorrectos.",
  INVALID_PASSWORD: "La contraseña actual no es correcta.",
  INVALID_EMAIL: "El correo no es válido.",
  USER_ALREADY_EXISTS: "Ya existe un usuario con ese correo.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe un usuario con ese correo.",
  PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  USER_NOT_FOUND: "El usuario no existe.",
};

export function mensajeDeError(error: unknown): string {
  if (isAPIError(error)) {
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code && MENSAJES[code]) return MENSAJES[code];
    if (error.body?.message) return error.body.message;
  }
  console.error(error);
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

// Resultado que devuelven las acciones de los formularios.
export type Estado = { ok: boolean; mensaje: string } | null;
