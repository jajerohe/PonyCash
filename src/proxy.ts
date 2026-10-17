import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Revisión rápida: si no hay cookie de sesión, mandar al login.
// La verificación real (sesión válida y rol) se hace en cada página y acción.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todo excepto el login, la API de autenticación y los archivos estáticos.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
