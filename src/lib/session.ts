import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";

// Devuelve la sesión actual, o null si nadie ha iniciado sesión.
export async function getSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

// Para páginas y acciones que requieren haber iniciado sesión.
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
