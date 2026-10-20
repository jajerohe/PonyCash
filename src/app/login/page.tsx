import Link from "next/link";
import { redirect } from "next/navigation";
import { Formulario } from "@/components/formulario";
import { MarcoAcceso } from "@/components/marco-acceso";
import { Campo } from "@/components/ui";
import { hayUsuarios } from "@/lib/configuracion";
import { getSession } from "@/lib/session";
import { iniciarSesion } from "./actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Si ya inició sesión, no tiene sentido mostrar el login.
  if (await getSession()) redirect("/");
  // Si la app es nueva y no hay usuarios, primero hay que crear el administrador.
  if (!(await hayUsuarios())) redirect("/configurar");
  const { restablecida } = await searchParams;

  return (
    <MarcoAcceso
      subtitulo="Inicia sesión para continuar"
      pie={
        <Link href="/recuperar" className="text-violet-600 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      }
    >
      {restablecida && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Tu contraseña se cambió. Ya puedes iniciar sesión con la nueva.
        </p>
      )}
      <Formulario accion={iniciarSesion} textoBoton="Iniciar sesión" anchoCompleto>
        <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" required autoFocus />
        <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" required />
      </Formulario>
    </MarcoAcceso>
  );
}
