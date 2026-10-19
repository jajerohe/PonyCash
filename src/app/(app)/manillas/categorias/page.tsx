import Link from "next/link";
import { asc } from "drizzle-orm";
import { Formulario } from "@/components/formulario";
import { Campo, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { categoriaManilla } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { actualizarCategoria, crearCategoria, eliminarCategoria } from "../actions";

export default async function CategoriasPage() {
  await requireAdmin();
  const categorias = await getDb()
    .select()
    .from(categoriaManilla)
    .orderBy(asc(categoriaManilla.nombre));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/manillas" className="text-sm text-violet-600 hover:underline">
          ← Volver a manillas
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Categorías de manillas</h1>
        <p className="text-sm text-slate-500">Los tipos de manilla que se venden en el parque</p>
      </div>

      <Tarjeta>
        <h2 className="mb-4 font-semibold">Nueva categoría</h2>
        <Formulario accion={crearCategoria} textoBoton="Crear categoría" limpiarAlGuardar>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Campo etiqueta="Nombre" name="nombre" placeholder="Ej: Pasaporte Total" required />
            <Campo etiqueta="Color" name="color" type="color" defaultValue="#7c3aed" className="h-10 w-20 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
          </div>
          <Campo etiqueta="Descripción (opcional)" name="descripcion" placeholder="Ej: Acceso a todas las atracciones" />
        </Formulario>
      </Tarjeta>

      {categorias.map((c) => (
        <Tarjeta key={c.id} className={c.activa ? "" : "opacity-70"}>
          <Formulario accion={actualizarCategoria} textoBoton="Guardar cambios">
            <input type="hidden" name="id" value={c.id} />
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Campo etiqueta="Nombre" name="nombre" defaultValue={c.nombre} required />
              <Campo etiqueta="Color" name="color" type="color" defaultValue={c.color} className="h-10 w-20 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
            </div>
            <Campo etiqueta="Descripción (opcional)" name="descripcion" defaultValue={c.descripcion ?? ""} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="activa" defaultChecked={c.activa} className="h-4 w-4 accent-violet-600" />
              Activa (se puede elegir al registrar ventas)
            </label>
          </Formulario>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Formulario
              accion={eliminarCategoria}
              textoBoton="Eliminar categoría"
              variante="secundario"
              confirmar={`¿Eliminar la categoría "${c.nombre}"?`}
              className="space-y-2"
            >
              <input type="hidden" name="id" value={c.id} />
            </Formulario>
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}
