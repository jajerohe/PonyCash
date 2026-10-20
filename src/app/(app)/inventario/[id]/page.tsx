import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Formulario } from "@/components/formulario";
import { Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { producto } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import { eliminarProducto } from "../actions";
import { FormularioProducto } from "../formulario-producto";

export default async function EditarProductoPage({ params }: PageProps<"/inventario/[id]">) {
  const { puede } = await requirePermiso("inventario.editar");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [este] = await getDb().select().from(producto).where(eq(producto.id, id));
  if (!este) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/inventario" className="text-sm text-violet-600 hover:underline">
          ← Volver al inventario
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{este.nombre}</h1>
      </div>

      <Tarjeta>
        <FormularioProducto producto={este} />
      </Tarjeta>

      {puede("inventario.eliminar") && (
        <Tarjeta className="border-red-200">
          <h2 className="mb-1 font-semibold text-red-700">Eliminar producto</h2>
          <p className="mb-4 text-sm text-slate-500">
            Se borra del inventario para siempre. Si solo dejará de usarse, desmárcalo como activo.
          </p>
          <Formulario
            accion={eliminarProducto}
            textoBoton="Eliminar producto"
            variante="peligro"
            confirmar={`¿Eliminar ${este.nombre} del inventario?`}
            className="space-y-2"
          >
            <input type="hidden" name="id" value={este.id} />
          </Formulario>
        </Tarjeta>
      )}
    </div>
  );
}
