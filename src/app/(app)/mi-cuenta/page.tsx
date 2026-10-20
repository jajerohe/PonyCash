import { Formulario } from "@/components/formulario";
import { Campo, Tarjeta } from "@/components/ui";
import { nombreDelRol, requireSession } from "@/lib/session";
import { cambiarMiContrasena } from "./actions";

export default async function MiCuentaPage({ searchParams }: PageProps<"/mi-cuenta">) {
  const { user } = await requireSession();
  const { cambiada } = await searchParams;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi cuenta</h1>
        <p className="text-sm text-slate-500">
          {user.name} · {user.email} · {nombreDelRol(user.role)}
        </p>
      </div>

      <Tarjeta>
        <h2 className="mb-4 font-semibold">Cambiar mi contraseña</h2>
        {cambiada && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Contraseña cambiada. Las sesiones abiertas en otros equipos se cerraron.
          </p>
        )}
        <Formulario accion={cambiarMiContrasena} textoBoton="Cambiar contraseña">
          <Campo etiqueta="Contraseña actual" name="actual" type="password" autoComplete="current-password" required />
          <Campo
            etiqueta="Nueva contraseña"
            name="nueva"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
          <Campo
            etiqueta="Repite la nueva contraseña"
            name="confirmar"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-slate-500">Mínimo 8 caracteres.</p>
        </Formulario>
      </Tarjeta>
    </div>
  );
}
