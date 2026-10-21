import { asc } from "drizzle-orm";
import { Catalogo } from "@/components/catalogo";
import { getDb } from "@/db";
import { manilla } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { cambiarEstadoManilla, eliminarManilla, guardarManilla } from "./actions";

export default async function ManillasPage() {
  const { user } = await requireSession();
  const manillas = await getDb()
    .select({ id: manilla.id, nombre: manilla.nombre, descripcion: manilla.descripcion, activa: manilla.activa })
    .from(manilla)
    .orderBy(asc(manilla.nombre));

  return (
    <Catalogo
      elementos={manillas}
      puedeEditar={user.role === "admin"}
      textos={{
        titulo: "Listado de Manillas",
        buscar: "Buscar manilla",
        singular: "manilla",
        plural: "manillas",
        nuevo: "Nueva manilla",
      }}
      acciones={{ guardar: guardarManilla, cambiarEstado: cambiarEstadoManilla, eliminar: eliminarManilla }}
    />
  );
}
