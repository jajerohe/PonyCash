import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Formulario } from "@/components/formulario";
import { Campo } from "@/components/ui";
import { hayUsuarios } from "@/lib/configuracion";
import { crearPrimerAdmin } from "./actions";

// Primera vez que se abre la app: crear el administrador.
export default async function ConfigurarPage() {
  await connection(); // revisar en cada visita, no guardar la página al compilar
  if (await hayUsuarios()) redirect("/login");

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white shadow-lg shadow-violet-200">
            P
          </div>
          <h1 className="text-2xl font-bold">Bienvenido a PonyCash</h1>
          <p className="mt-1 text-sm text-slate-500">Crea la cuenta del administrador para empezar</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Formulario accion={crearPrimerAdmin} textoBoton="Crear administrador" anchoCompleto>
            <Campo etiqueta="Nombre" name="name" autoComplete="name" required autoFocus />
            <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" required />
            <Campo
              etiqueta="Contraseña"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
            <Campo
              etiqueta="Repite la contraseña"
              name="confirmar"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Formulario>
        </div>
      </div>
    </main>
  );
}
