import { asc } from "drizzle-orm";
import { Formulario } from "@/components/formulario";
import { Campo, Selector } from "@/components/ui";
import { getDb } from "@/db";
import { categoria, tipoTarifa } from "@/db/schema";
import { guardarManilla } from "../actions";

// Formulario compartido por "Nueva manilla" y "Editar manilla".
export async function FormularioManilla({
  manilla,
  valores,
  categoriaInicial,
}: {
  manilla?: { id: number; nombre: string; categoriaId: number; orden: number; activa: boolean };
  valores?: Map<number, number>;
  categoriaInicial?: number;
}) {
  const db = getDb();
  const [categorias, tipos] = await Promise.all([
    db.select().from(categoria).orderBy(asc(categoria.orden), asc(categoria.nombre)),
    db.select().from(tipoTarifa).orderBy(asc(tipoTarifa.orden), asc(tipoTarifa.nombre)),
  ]);
  // Se muestran los tipos activos y los inactivos que esta manilla ya usa.
  const tiposVisibles = tipos.filter((t) => t.activa || valores?.has(t.id));

  return (
    <Formulario accion={guardarManilla} textoBoton={manilla ? "Guardar cambios" : "Crear manilla"}>
      <input type="hidden" name="id" value={manilla?.id ?? 0} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector
          etiqueta="Categoría"
          name="categoriaId"
          defaultValue={String(manilla?.categoriaId ?? categoriaInicial ?? "")}
          required
        >
          <option value="" disabled>
            Elige una categoría
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Selector>
        <Campo etiqueta="Nombre" name="nombre" defaultValue={manilla?.nombre} placeholder="Ej: ADULTO" required />
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Valores</legend>
        <p className="mb-3 text-xs text-slate-500">
          Deja vacío el tipo de tarifa que no aplica a esta manilla.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {tiposVisibles.map((t) => (
            <Campo
              key={t.id}
              etiqueta={t.nombre}
              name={`valor_${t.id}`}
              inputMode="numeric"
              placeholder="—"
              defaultValue={valores?.get(t.id)?.toString() ?? ""}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Orden en la lista" name="orden" type="number" min={0} defaultValue={manilla?.orden ?? 0} />
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="activa"
            defaultChecked={manilla?.activa ?? true}
            className="h-4 w-4 accent-violet-600"
          />
          Activa
        </label>
      </div>
    </Formulario>
  );
}
