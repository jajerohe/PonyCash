import Link from "next/link";
import { asc } from "drizzle-orm";
import { Formulario } from "@/components/formulario";
import { Campo, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { categoria, tipoTarifa } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { actualizarCatalogo, crearCatalogo, eliminarCatalogo } from "../actions";

type Elemento = { id: number; nombre: string; orden: number; activa: boolean };

// Lista editable (categorías o tipos de tarifa): crear, renombrar, ordenar, activar y eliminar.
function Catalogo({
  titulo,
  ayuda,
  catalogo,
  elementos,
  ejemplo,
}: {
  titulo: string;
  ayuda: string;
  catalogo: "categoria" | "tipo";
  elementos: Elemento[];
  ejemplo: string;
}) {
  const oculto = <input type="hidden" name="catalogo" value={catalogo} />;
  return (
    <Tarjeta className="space-y-4">
      <div>
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-sm text-slate-500">{ayuda}</p>
      </div>

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {elementos.map((e) => (
          <div key={e.id} className="flex flex-wrap items-start gap-3 p-3">
            <Formulario
              accion={actualizarCatalogo}
              textoBoton="Guardar"
              variante="secundario"
              className="flex flex-1 flex-wrap items-end gap-3 [&>p]:basis-full"
            >
              {oculto}
              <input type="hidden" name="id" value={e.id} />
              <div className="min-w-48 flex-1">
                <Campo etiqueta="Nombre" name="nombre" defaultValue={e.nombre} required />
              </div>
              <div className="w-24">
                <Campo etiqueta="Orden" name="orden" type="number" min={0} defaultValue={e.orden} />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="activa" defaultChecked={e.activa} className="h-4 w-4 accent-violet-600" />
                Activa
              </label>
            </Formulario>
            <Formulario
              accion={eliminarCatalogo}
              textoBoton="Eliminar"
              variante="secundario"
              confirmar={`¿Eliminar "${e.nombre}"?`}
              className="flex flex-col items-end gap-1 pt-6"
            >
              {oculto}
              <input type="hidden" name="id" value={e.id} />
            </Formulario>
          </div>
        ))}
      </div>

      <Formulario
        accion={crearCatalogo}
        textoBoton="Agregar"
        limpiarAlGuardar
        className="flex flex-wrap items-end gap-3 [&>p]:basis-full"
      >
        {oculto}
        <div className="min-w-48 flex-1">
          <Campo etiqueta="Nuevo" name="nombre" placeholder={ejemplo} required />
        </div>
        <div className="w-24">
          <Campo etiqueta="Orden" name="orden" type="number" min={0} defaultValue={elementos.length + 1} />
        </div>
      </Formulario>
    </Tarjeta>
  );
}

export default async function ConfiguracionTarifasPage() {
  await requireAdmin();
  const db = getDb();
  const [categorias, tipos] = await Promise.all([
    db.select().from(categoria).orderBy(asc(categoria.orden), asc(categoria.nombre)),
    db.select().from(tipoTarifa).orderBy(asc(tipoTarifa.orden), asc(tipoTarifa.nombre)),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/tarifas" className="text-sm text-violet-600 hover:underline">
          ← Volver a tarifas
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Categorías y tipos de tarifa</h1>
        <p className="text-sm text-slate-500">El orden define cómo aparecen en la tabla de tarifas.</p>
      </div>

      <Catalogo
        titulo="Categorías"
        ayuda="Agrupan las manillas: Entradas, Pase anual, Combos…"
        catalogo="categoria"
        elementos={categorias}
        ejemplo="Ej: TEMPORADA ALTA"
      />
      <Catalogo
        titulo="Tipos de tarifa"
        ayuda="Las clases de precio: Plena, Convenio, Taquilla, Web…"
        catalogo="tipo"
        elementos={tipos}
        ejemplo="Ej: CONVENIO No. 3"
      />
    </div>
  );
}
