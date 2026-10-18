import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Formulario } from "@/components/formulario";
import { Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { manilla, tarifa } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { eliminarManilla } from "../../actions";
import { FormularioManilla } from "../formulario-manilla";

export default async function EditarManillaPage({ params }: PageProps<"/tarifas/manillas/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [[esta], tarifas] = await Promise.all([
    db.select().from(manilla).where(eq(manilla.id, id)),
    db.select().from(tarifa).where(eq(tarifa.manillaId, id)),
  ]);
  if (!esta) notFound();
  const valores = new Map(tarifas.map((t) => [t.tipoTarifaId, t.valor]));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/tarifas" className="text-sm text-violet-600 hover:underline">
          ← Volver a tarifas
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{esta.nombre}</h1>
      </div>

      <Tarjeta>
        <FormularioManilla manilla={esta} valores={valores} />
      </Tarjeta>

      <Tarjeta className="border-red-200">
        <h2 className="mb-1 font-semibold text-red-700">Eliminar manilla</h2>
        <p className="mb-4 text-sm text-slate-500">
          Se borran la manilla y todos sus valores. Si solo dejarás de venderla, desmárcala como activa.
        </p>
        <Formulario
          accion={eliminarManilla}
          textoBoton="Eliminar manilla"
          variante="peligro"
          confirmar={`¿Eliminar ${esta.nombre} y todos sus valores?`}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={esta.id} />
        </Formulario>
      </Tarjeta>
    </div>
  );
}
