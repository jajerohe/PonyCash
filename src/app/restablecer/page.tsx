import Link from "next/link";
import { Formulario } from "@/components/formulario";
import { MarcoAcceso } from "@/components/marco-acceso";
import { Campo } from "@/components/ui";
import { restablecerContrasena } from "../recuperar/actions";

// Página a la que lleva el enlace del correo: aquí se crea la contraseña nueva.
export default async function RestablecerPage({ searchParams }: PageProps<"/restablecer">) {
  const { token } = await searchParams;
  const volver = (
    <Link href="/recuperar" className="text-violet-600 hover:underline">
      Pedir un enlace nuevo
    </Link>
  );

  if (typeof token !== "string" || !token) {
    return (
      <MarcoAcceso subtitulo="Crea tu contraseña nueva" pie={volver}>
        <p className="text-sm text-red-700">Este enlace no es válido.</p>
      </MarcoAcceso>
    );
  }

  return (
    <MarcoAcceso subtitulo="Crea tu contraseña nueva" pie={volver}>
      <Formulario accion={restablecerContrasena} textoBoton="Guardar contraseña" anchoCompleto>
        <input type="hidden" name="token" value={token} />
        <Campo etiqueta="Nueva contraseña" name="nueva" type="password" minLength={8} autoComplete="new-password" required autoFocus />
        <Campo etiqueta="Repite la contraseña" name="confirmar" type="password" minLength={8} autoComplete="new-password" required />
        <p className="text-xs text-slate-500">Mínimo 8 caracteres. Al guardarla se cierran todas tus sesiones abiertas.</p>
      </Formulario>
    </MarcoAcceso>
  );
}
