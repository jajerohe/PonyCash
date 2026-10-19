import Link from "next/link";
import { asc, count } from "drizzle-orm";
import { Insignia, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { perfil, perfilPermiso, user } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import { TODOS_LOS_PERMISOS } from "@/lib/permisos";

export default async function PerfilesPage() {
  const { puede } = await requirePermiso("perfiles.ver");

  const db = getDb();
  const [perfiles, usuarios, permisos] = await Promise.all([
    db.select().from(perfil).orderBy(asc(perfil.nombre)),
    db.select({ perfilId: user.perfilId, total: count() }).from(user).groupBy(user.perfilId),
    db.select({ perfilId: perfilPermiso.perfilId, total: count() }).from(perfilPermiso).groupBy(perfilPermiso.perfilId),
  ]);
  const usuariosPorPerfil = new Map(usuarios.map((u) => [u.perfilId, u.total]));
  const permisosPorPerfil = new Map(permisos.map((p) => [p.perfilId, p.total]));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Perfiles</h1>
          <p className="text-sm text-slate-500">Qué puede hacer cada perfil en cada módulo del sistema</p>
        </div>
        {puede("perfiles.gestionar") && (
          <Link
            href="/perfiles/nuevo"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            + Nuevo perfil
          </Link>
        )}
      </div>

      <Tarjeta className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Descripción</th>
              <th className="px-4 py-3 text-right font-medium">Usuarios</th>
              <th className="px-4 py-3 text-right font-medium">Permisos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {perfiles.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-2">
                    {p.nombre}
                    {p.esAdministrador && <Insignia color="violeta">Acceso total</Insignia>}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{p.descripcion}</td>
                <td className="px-4 py-3 text-right">{usuariosPorPerfil.get(p.id) ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  {p.esAdministrador
                    ? "Todos"
                    : `${permisosPorPerfil.get(p.id) ?? 0} de ${TODOS_LOS_PERMISOS.length}`}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/perfiles/${p.id}`} className="font-medium text-violet-600 hover:underline">
                    {puede("perfiles.gestionar") ? "Editar" : "Ver"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tarjeta>
    </div>
  );
}
