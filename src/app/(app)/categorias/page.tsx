import { asc } from "drizzle-orm";
import { Formulario } from "@/components/formulario";
import { Campo, Insignia, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { categoria } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import { actualizarCategoria, crearCategoria, eliminarCategoria } from "./actions";

export default async function CategoriasPage() {
  const { puede } = await requirePermiso("categorias.ver");
  const categorias = await getDb()
    .select()
    .from(categoria)
    .orderBy(asc(categoria.orden), asc(categoria.nombre));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categorías</h1>
        <p className="text-sm text-slate-500">{categorias.length} categoría(s). El orden define cómo aparecen en las listas.</p>
      </div>

      {puede("categorias.crear") && (
        <Tarjeta>
          <h2 className="mb-4 font-semibold">Nueva categoría</h2>
          <Formulario
            accion={crearCategoria}
            textoBoton="Crear categoría"
            limpiarAlGuardar
            className="flex flex-wrap items-end gap-3 [&>p]:basis-full"
          >
            <div className="min-w-48 flex-1">
              <Campo etiqueta="Nombre" name="nombre" placeholder="Ej: Eventos" required />
            </div>
            <div className="w-24">
              <Campo etiqueta="Orden" name="orden" type="number" min={0} defaultValue={categorias.length + 1} />
            </div>
          </Formulario>
        </Tarjeta>
      )}

      <Tarjeta className="p-0">
        {categorias.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Todavía no hay categorías.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categorias.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-3 px-6 py-4">
                {puede("categorias.editar") ? (
                  <Formulario
                    accion={actualizarCategoria}
                    textoBoton="Guardar"
                    variante="secundario"
                    className="flex flex-1 flex-wrap items-end gap-3 [&>p]:basis-full"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <div className="min-w-48 flex-1">
                      <Campo etiqueta="Nombre" name="nombre" defaultValue={c.nombre} required />
                    </div>
                    <div className="w-24">
                      <Campo etiqueta="Orden" name="orden" type="number" min={0} defaultValue={c.orden} />
                    </div>
                    <label className="flex items-center gap-2 pb-2 text-sm">
                      <input type="checkbox" name="activa" defaultChecked={c.activa} className="h-4 w-4 accent-violet-600" />
                      Activa
                    </label>
                  </Formulario>
                ) : (
                  <p className="flex flex-1 items-center gap-2 py-2 font-medium">
                    <span className="w-8 text-sm text-slate-400">{c.orden}</span>
                    {c.nombre}
                    {!c.activa && <Insignia color="gris">Inactiva</Insignia>}
                  </p>
                )}
                {puede("categorias.eliminar") && (
                  <Formulario
                    accion={eliminarCategoria}
                    textoBoton="Eliminar"
                    variante="secundario"
                    confirmar={`¿Eliminar la categoría "${c.nombre}"?`}
                    className={`flex flex-col items-end gap-1 ${puede("categorias.editar") ? "pt-6" : ""}`}
                  >
                    <input type="hidden" name="id" value={c.id} />
                  </Formulario>
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
