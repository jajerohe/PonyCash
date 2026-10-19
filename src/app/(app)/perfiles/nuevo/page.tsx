import Link from "next/link";
import { Tarjeta } from "@/components/ui";
import { requirePermiso } from "@/lib/accesos";
import { FormularioPerfil } from "../formulario-perfil";

export default async function NuevoPerfilPage() {
  await requirePermiso("perfiles.gestionar");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/perfiles" className="text-sm text-violet-600 hover:underline">
          ← Volver a perfiles
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nuevo perfil</h1>
        <p className="text-sm text-slate-500">Marca las opciones de cada módulo que este perfil puede usar.</p>
      </div>
      <Tarjeta>
        <FormularioPerfil soloLectura={false} />
      </Tarjeta>
    </div>
  );
}
