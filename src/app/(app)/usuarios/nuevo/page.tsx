import Link from "next/link";
import { Formulario } from "@/components/formulario";
import { Campo, Selector, Tarjeta } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { crearUsuario } from "../actions";

export default async function NuevoUsuarioPage() {
  await requireAdmin();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/usuarios" className="text-sm text-violet-600 hover:underline">
          ← Volver a usuarios
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nuevo usuario</h1>
      </div>

      <Tarjeta>
        <Formulario accion={crearUsuario} textoBoton="Crear usuario">
          <Campo etiqueta="Nombre" name="name" required />
          <Campo etiqueta="Correo" name="email" type="email" required />
          <Campo etiqueta="Contraseña" name="password" type="password" minLength={8} required />
          <Selector etiqueta="Rol" name="role" defaultValue="user">
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </Selector>
        </Formulario>
      </Tarjeta>
    </div>
  );
}
