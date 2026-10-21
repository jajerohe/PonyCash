import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { manilla } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { ListadoManillas } from "./listado";

export default async function ManillasPage() {
  const { user } = await requireSession();
  const manillas = await getDb()
    .select({ id: manilla.id, nombre: manilla.nombre, descripcion: manilla.descripcion, activa: manilla.activa })
    .from(manilla)
    .orderBy(asc(manilla.nombre));

  return <ListadoManillas manillas={manillas} puedeEditar={user.role === "admin"} />;
}
