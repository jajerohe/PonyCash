import { asc, desc } from "drizzle-orm";
import { Catalogo } from "@/components/catalogo";
import { getDb } from "@/db";
import { tipoTarifa } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { cambiarEstadoTipoTarifa, eliminarTipoTarifa, guardarTipoTarifa } from "./actions";

export default async function TiposTarifaPage() {
  const { user } = await requireSession();
  // La tarifa Plena (protegida) va primero; el resto por nombre.
  const tipos = await getDb()
    .select({
      id: tipoTarifa.id,
      nombre: tipoTarifa.nombre,
      descripcion: tipoTarifa.descripcion,
      activa: tipoTarifa.activa,
      protegido: tipoTarifa.protegido,
    })
    .from(tipoTarifa)
    .orderBy(desc(tipoTarifa.protegido), asc(tipoTarifa.nombre));

  return (
    <Catalogo
      elementos={tipos}
      puedeEditar={user.role === "admin"}
      textos={{
        titulo: "Listado de Tipos de Tarifas",
        buscar: "Buscar tipo de tarifa",
        singular: "tipo de tarifa",
        plural: "tipos de tarifa",
        nuevo: "Nuevo tipo de tarifa",
      }}
      acciones={{ guardar: guardarTipoTarifa, cambiarEstado: cambiarEstadoTipoTarifa, eliminar: eliminarTipoTarifa }}
    />
  );
}
