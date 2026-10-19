import Link from "next/link";
import { asc } from "drizzle-orm";
import { Formulario } from "@/components/formulario";
import { Campo, Selector, Tarjeta } from "@/components/ui";
import { getDb } from "@/db";
import { perfil } from "@/db/schema";
import { requirePermiso } from "@/lib/accesos";
import { crearUsuario } from "../actions";

export default async function NuevoUsuarioPage() {
  const { esAdministrador } = await requirePermiso("usuarios.crear");
  const perfiles = (await getDb().select().from(perfil).orderBy(asc(perfil.nombre))).filter(
    (p) => esAdministrador || !p.esAdministrador,
  );

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
          <Selector etiqueta="Perfil" name="perfilId" defaultValue="" required>
            <option value="" disabled>
              Elige un perfil
            </option>
            {perfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Selector>
        </Formulario>
      </Tarjeta>
    </div>
  );
}
