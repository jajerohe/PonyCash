import Link from "next/link";
import { Tarjeta } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { FormularioManilla } from "../formulario-manilla";

export default async function NuevaManillaPage({ searchParams }: PageProps<"/tarifas/manillas/nueva">) {
  await requireAdmin();
  const { categoria } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/tarifas" className="text-sm text-violet-600 hover:underline">
          ← Volver a tarifas
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nueva manilla</h1>
      </div>
      <Tarjeta>
        <FormularioManilla categoriaInicial={Number(categoria) || undefined} />
      </Tarjeta>
    </div>
  );
}
