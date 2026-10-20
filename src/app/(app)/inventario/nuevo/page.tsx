import Link from "next/link";
import { Tarjeta } from "@/components/ui";
import { requirePermiso } from "@/lib/accesos";
import { FormularioProducto } from "../formulario-producto";

export default async function NuevoProductoPage() {
  await requirePermiso("inventario.crear");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/inventario" className="text-sm text-violet-600 hover:underline">
          ← Volver al inventario
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nuevo producto</h1>
      </div>
      <Tarjeta>
        <FormularioProducto />
      </Tarjeta>
    </div>
  );
}
