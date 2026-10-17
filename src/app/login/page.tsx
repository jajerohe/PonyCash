import { redirect } from "next/navigation";
import { Formulario } from "@/components/formulario";
import { Campo } from "@/components/ui";
import { getSession } from "@/lib/session";
import { iniciarSesion } from "./actions";

export default async function LoginPage() {
  // Si ya inició sesión, no tiene sentido mostrar el login.
  if (await getSession()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white shadow-lg shadow-violet-200">
            P
          </div>
          <h1 className="text-2xl font-bold">PonyCash</h1>
          <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Formulario accion={iniciarSesion} textoBoton="Iniciar sesión" anchoCompleto>
            <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" required autoFocus />
            <Campo
              etiqueta="Contraseña"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Formulario>
        </div>
      </div>
    </main>
  );
}
