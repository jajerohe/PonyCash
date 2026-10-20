import { asc } from "drizzle-orm";
import { Formulario } from "@/components/formulario";
import { Campo, Selector } from "@/components/ui";
import { getDb } from "@/db";
import { categoria } from "@/db/schema";
import { guardarProducto } from "./actions";

// Formulario compartido por "Nuevo producto" y "Editar producto".
export async function FormularioProducto({
  producto,
}: {
  producto?: { id: number; categoriaId: number; nombre: string; cantidad: number; orden: number; activo: boolean };
}) {
  const categorias = await getDb()
    .select()
    .from(categoria)
    .orderBy(asc(categoria.orden), asc(categoria.nombre));
  // Se ofrecen las categorías activas, más la actual del producto aunque esté inactiva.
  const opciones = categorias.filter((c) => c.activa || c.id === producto?.categoriaId);

  return (
    <Formulario accion={guardarProducto} textoBoton={producto ? "Guardar cambios" : "Crear producto"}>
      <input type="hidden" name="id" value={producto?.id ?? 0} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector etiqueta="Categoría" name="categoriaId" defaultValue={String(producto?.categoriaId ?? "")} required>
          <option value="" disabled>
            Elige una categoría
          </option>
          {opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Selector>
        <Campo etiqueta="Producto" name="nombre" defaultValue={producto?.nombre} placeholder="Ej: ADULTO" required />
        <Campo
          etiqueta="Cantidad"
          name="cantidad"
          type="number"
          min={0}
          step={1}
          defaultValue={producto?.cantidad ?? 0}
          required
        />
        <Campo etiqueta="Orden en la lista" name="orden" type="number" min={0} defaultValue={producto?.orden ?? 0} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activo" defaultChecked={producto?.activo ?? true} className="h-4 w-4 accent-violet-600" />
        Activo
      </label>
    </Formulario>
  );
}
