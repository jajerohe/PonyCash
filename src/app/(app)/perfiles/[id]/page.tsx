import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Formulario } from "@/components/formulario";
import { Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { perfil, perfilPermiso, user } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import { eliminarPerfil } from "../actions";
import { FormularioPerfil } from "../formulario-perfil";

export default async function PerfilPage({ params }: PageProps<"/perfiles/[id]">) {
  const { puede } = await requirePermiso("perfiles.ver");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const db = getDb();
  const [[este], permisos, [{ usuarios }]] = await Promise.all([
    db.select().from(perfil).where(eq(perfil.id, id)),
    db.select().from(perfilPermiso).where(eq(perfilPermiso.perfilId, id)),
    db.select({ usuarios: count() }).from(user).where(eq(user.perfilId, id)),
  ]);
  if (!este) notFound();
  const gestiona = puede("perfiles.gestionar");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/perfiles" className="text-sm text-violet-600 hover:underline">
          ← Volver a perfiles
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{este.nombre}</h1>
        <p className="text-sm text-slate-500">{usuarios} usuario(s) con este perfil</p>
      </div>

      <Tarjeta>
        <FormularioPerfil
          perfil={este}
          permisos={new Set(permisos.map((p) => p.permiso))}
          soloLectura={!gestiona}
        />
      </Tarjeta>

      {gestiona && !este.esAdministrador && (
        <Tarjeta className="border-red-200">
          <h2 className="mb-1 font-semibold text-red-700">Eliminar perfil</h2>
          <p className="mb-4 text-sm text-slate-500">
            Solo se puede eliminar si ningún usuario lo tiene asignado.
          </p>
          <Formulario
            accion={eliminarPerfil}
            textoBoton="Eliminar perfil"
            variante="peligro"
            confirmar={`¿Eliminar el perfil "${este.nombre}"?`}
            className="space-y-2"
          >
            <input type="hidden" name="id" value={este.id} />
          </Formulario>
        </Tarjeta>
      )}
    </div>
  );
}
