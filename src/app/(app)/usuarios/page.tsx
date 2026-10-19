import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Insignia, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { perfil, user } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";

export default async function UsuariosPage() {
  const { puede } = await requirePermiso("usuarios.ver");
  const puedeEditar = (["usuarios.editar", "usuarios.perfil", "usuarios.contrasena", "usuarios.bloquear", "usuarios.eliminar"] as const).some(puede);

  const users = await getDb()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      banned: user.banned,
      createdAt: user.createdAt,
      perfil: perfil.nombre,
      esAdministrador: perfil.esAdministrador,
    })
    .from(user)
    .leftJoin(perfil, eq(user.perfilId, perfil.id))
    .orderBy(desc(user.createdAt))
    .limit(200);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-slate-500">{users.length} usuario(s) registrados</p>
        </div>
        {puede("usuarios.crear") && (
          <Link
            href="/usuarios/nuevo"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            + Nuevo usuario
          </Link>
        )}
      </div>

      <Tarjeta className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Insignia color={u.esAdministrador ? "violeta" : "gris"}>{u.perfil ?? "Sin perfil"}</Insignia>
                </td>
                <td className="px-4 py-3">
                  {u.banned ? <Insignia color="rojo">Bloqueado</Insignia> : <Insignia color="verde">Activo</Insignia>}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString("es-CO")}
                </td>
                <td className="px-4 py-3 text-right">
                  {puedeEditar && (
                    <Link href={`/usuarios/${u.id}`} className="font-medium text-violet-600 hover:underline">
                      Editar
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tarjeta>
    </div>
  );
}
