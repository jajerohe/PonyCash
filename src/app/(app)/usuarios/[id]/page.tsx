import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Formulario } from "@/components/formulario";
import { Campo, Insignia, Selector, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { user } from "@/db/schema";
import { nombreDelRol, requireAdmin } from "@/lib/session";
import {
  actualizarDatos,
  cambiarBloqueo,
  cambiarContrasena,
  cambiarRol,
  eliminarUsuario,
} from "../actions";

export default async function EditarUsuarioPage({ params }: PageProps<"/usuarios/[id]">) {
  const { user: yo } = await requireAdmin();
  const { id } = await params;

  const [usuario] = await getDb()
    .select({ id: user.id, name: user.name, email: user.email, banned: user.banned, role: user.role })
    .from(user)
    .where(eq(user.id, id));
  if (!usuario) notFound();

  const soyYo = usuario.id === yo.id;
  const idOculto = <input type="hidden" name="userId" value={usuario.id} />;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/usuarios" className="text-sm text-marca-600 hover:underline">
          ← Volver a usuarios
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{usuario.name}</h1>
        <p className="flex items-center gap-2 text-sm text-slate-500">
          {usuario.email}
          <Insignia color={usuario.role === "admin" ? "marca" : "gris"}>{nombreDelRol(usuario.role)}</Insignia>
        </p>
      </div>

      <Tarjeta>
        <h2 className="mb-4 font-semibold">Datos</h2>
        <Formulario accion={actualizarDatos} textoBoton="Guardar datos">
          {idOculto}
          <Campo etiqueta="Nombre" name="name" defaultValue={usuario.name} required />
          <Campo etiqueta="Correo" name="email" type="email" defaultValue={usuario.email} required />
        </Formulario>
      </Tarjeta>

      {!soyYo && (
        <Tarjeta>
          <h2 className="mb-4 font-semibold">Rol</h2>
          <Formulario accion={cambiarRol} textoBoton="Cambiar rol">
            {idOculto}
            <Selector etiqueta="Rol" name="role" defaultValue={usuario.role === "admin" ? "admin" : "user"}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </Selector>
          </Formulario>
        </Tarjeta>
      )}

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

      {!soyYo && (
        <Tarjeta className="border-red-200">
          <h2 className="mb-1 font-semibold text-red-700">Zona de peligro</h2>
          <p className="mb-4 text-sm text-slate-500">
            Un usuario bloqueado no puede iniciar sesión. Eliminarlo borra su cuenta para siempre.
          </p>
          <div className="space-y-4">
            <Formulario
              accion={cambiarBloqueo}
              textoBoton={usuario.banned ? "Desbloquear" : "Bloquear"}
              variante="secundario"
              className="space-y-2"
            >
              {idOculto}
              <input type="hidden" name="bloquear" value={usuario.banned ? "no" : "si"} />
            </Formulario>
            <Formulario
              accion={eliminarUsuario}
              textoBoton="Eliminar usuario"
              variante="peligro"
              confirmar={`¿Seguro que quieres eliminar a ${usuario.name}? No se puede deshacer.`}
              className="space-y-2"
            >
              {idOculto}
            </Formulario>
          </div>
        </Tarjeta>
      )}
    </div>
  );
}
