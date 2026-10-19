import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { perfil, perfilPermiso, user } from "@/db/schema";
import type { Permiso } from "./permisos";
import { requireSession } from "./session";

// Perfil y permisos de quien inició sesión (se consulta una vez por visita).
export const getAcceso = cache(async () => {
  const session = await requireSession();
  const db = getDb();
  const [fila] = await db
    .select({ id: perfil.id, nombre: perfil.nombre, esAdministrador: perfil.esAdministrador })
    .from(user)
    .leftJoin(perfil, eq(user.perfilId, perfil.id))
    .where(eq(user.id, session.user.id));

  const permisos = new Set<string>();
  if (fila?.id) {
    const filas = await db
      .select({ permiso: perfilPermiso.permiso })
      .from(perfilPermiso)
      .where(eq(perfilPermiso.perfilId, fila.id));
    for (const f of filas) permisos.add(f.permiso);
  }

  const esAdministrador = fila?.esAdministrador ?? false;
  return {
    session,
    perfil: fila?.id ? { id: fila.id, nombre: fila.nombre! } : null,
    esAdministrador,
    // El perfil de administrador puede todo, aunque no tenga filas en perfil_permiso.
    puede: (permiso: Permiso) => esAdministrador || permisos.has(permiso),
  };
});

// Para páginas y acciones: si no tiene el permiso, vuelve al inicio.
export async function requirePermiso(permiso: Permiso) {
  const acceso = await getAcceso();
  if (!acceso.puede(permiso)) redirect("/");
  return acceso;
}
