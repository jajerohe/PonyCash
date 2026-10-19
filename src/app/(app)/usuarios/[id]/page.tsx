import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Formulario } from "@/components/formulario";
import { Campo, Insignia, Selector, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { perfil, user } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import {
  actualizarDatos,
  cambiarBloqueo,
  cambiarContrasena,
  cambiarPerfil,
  eliminarUsuario,
} from "../actions";

export default async function EditarUsuarioPage({ params }: PageProps<"/usuarios/[id]">) {
  const { session, esAdministrador, puede } = await requirePermiso("usuarios.ver");
  const { id } = await params;

  const db = getDb();
  const [[usuario], perfiles] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        banned: user.banned,
        perfilId: user.perfilId,
        perfil: perfil.nombre,
        esAdministrador: perfil.esAdministrador,
      })
      .from(user)
      .leftJoin(perfil, eq(user.perfilId, perfil.id))
      .where(eq(user.id, id)),
    db.select().from(perfil).orderBy(asc(perfil.nombre)),
  ]);
  if (!usuario) notFound();

  const soyYo = usuario.id === session.user.id;
  // Solo un administrador puede modificar a otro administrador.
  const protegido = Boolean(usuario.esAdministrador) && !esAdministrador;
  const idOculto = <input type="hidden" name="userId" value={usuario.id} />;
  // Quien no es administrador no puede dar el perfil de administrador.
  const perfilesElegibles = perfiles.filter((p) => esAdministrador || !p.esAdministrador);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/usuarios" className="text-sm text-violet-600 hover:underline">
          ← Volver a usuarios
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{usuario.name}</h1>
        <p className="flex items-center gap-2 text-sm text-slate-500">
          {usuario.email}
          <Insignia color={usuario.esAdministrador ? "violeta" : "gris"}>{usuario.perfil ?? "Sin perfil"}</Insignia>
        </p>
      </div>

      {protegido && (
        <Tarjeta>
          <p className="text-sm text-slate-600">Solo un administrador puede modificar a este usuario.</p>
        </Tarjeta>
      )}

      {!protegido && puede("usuarios.editar") && (
        <Tarjeta>
          <h2 className="mb-4 font-semibold">Datos</h2>
          <Formulario accion={actualizarDatos} textoBoton="Guardar datos">
            {idOculto}
            <Campo etiqueta="Nombre" name="name" defaultValue={usuario.name} required />
            <Campo etiqueta="Correo" name="email" type="email" defaultValue={usuario.email} required />
          </Formulario>
        </Tarjeta>
      )}

      {!protegido && !soyYo && puede("usuarios.perfil") && (
        <Tarjeta>
          <h2 className="mb-4 font-semibold">Perfil</h2>
          <Formulario accion={cambiarPerfil} textoBoton="Cambiar perfil">
            {idOculto}
            <Selector etiqueta="Perfil" name="perfilId" defaultValue={String(usuario.perfilId ?? "")} required>
              <option value="" disabled>
                Elige un perfil
              </option>
              {perfilesElegibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Selector>
          </Formulario>
        </Tarjeta>
      )}

      {!protegido && puede("usuarios.contrasena") && (
        <Tarjeta>
          <h2 className="mb-4 font-semibold">Contraseña</h2>
          <Formulario accion={cambiarContrasena} textoBoton="Cambiar contraseña">
            {idOculto}
            <Campo
              etiqueta="Nueva contraseña"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Formulario>
        </Tarjeta>
      )}

      {!protegido && !soyYo && (puede("usuarios.bloquear") || puede("usuarios.eliminar")) && (
        <Tarjeta className="border-red-200">
          <h2 className="mb-1 font-semibold text-red-700">Zona de peligro</h2>
          <p className="mb-4 text-sm text-slate-500">
            Un usuario bloqueado no puede iniciar sesión. Eliminarlo borra su cuenta para siempre.
          </p>
          <div className="space-y-4">
            {puede("usuarios.bloquear") && (
              <Formulario
                accion={cambiarBloqueo}
                textoBoton={usuario.banned ? "Desbloquear" : "Bloquear"}
                variante="secundario"
                className="space-y-2"
              >
                {idOculto}
                <input type="hidden" name="bloquear" value={usuario.banned ? "no" : "si"} />
              </Formulario>
            )}
            {puede("usuarios.eliminar") && (
              <Formulario
                accion={eliminarUsuario}
                textoBoton="Eliminar usuario"
                variante="peligro"
                confirmar={`¿Seguro que quieres eliminar a ${usuario.name}? No se puede deshacer.`}
                className="space-y-2"
              >
                {idOculto}
              </Formulario>
            )}
          </div>
        </Tarjeta>
      )}
    </div>
  );
}
