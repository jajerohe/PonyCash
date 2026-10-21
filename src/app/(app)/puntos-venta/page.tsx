import { asc } from "drizzle-orm";
import { Catalogo } from "@/components/catalogo";
import { getDb } from "@/db";
import { puntoVenta } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { cambiarEstadoPuntoVenta, eliminarPuntoVenta, guardarPuntoVenta } from "./actions";

export default async function PuntosVentaPage() {
  const { user } = await requireSession();
  const puntos = await getDb()
    .select({
      id: puntoVenta.id,
      nombre: puntoVenta.nombre,
      descripcion: puntoVenta.descripcion,
      activa: puntoVenta.activa,
    })
    .from(puntoVenta)
    .orderBy(asc(puntoVenta.nombre));

  return (
    <Catalogo
      elementos={puntos}
      puedeEditar={user.role === "admin"}
      textos={{
        titulo: "Listado de Puntos de Venta",
        buscar: "Buscar punto de venta",
        singular: "punto de venta",
        plural: "puntos de venta",
        nuevo: "Nuevo punto de venta",
      }}
      acciones={{ guardar: guardarPuntoVenta, cambiarEstado: cambiarEstadoPuntoVenta, eliminar: eliminarPuntoVenta }}
    />
  );
}
