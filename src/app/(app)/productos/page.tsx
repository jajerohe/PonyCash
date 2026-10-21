import { asc } from "drizzle-orm";
import { Catalogo } from "@/components/catalogo";
import { getDb } from "@/db";
import { producto } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { cambiarEstadoProducto, eliminarProducto, guardarProducto } from "./actions";

export default async function ProductosPage() {
  const { user } = await requireSession();
  const productos = await getDb()
    .select({ id: producto.id, nombre: producto.nombre, descripcion: producto.descripcion, activa: producto.activa })
    .from(producto)
    .orderBy(asc(producto.nombre));

  return (
    <Catalogo
      elementos={productos}
      puedeEditar={user.role === "admin"}
      textos={{
        titulo: "Listado de Productos",
        buscar: "Buscar producto",
        singular: "producto",
        plural: "productos",
        nuevo: "Nuevo producto",
        alEliminar: "También se eliminarán sus tarifas. ",
      }}
      acciones={{ guardar: guardarProducto, cambiarEstado: cambiarEstadoProducto, eliminar: eliminarProducto }}
    />
  );
}
