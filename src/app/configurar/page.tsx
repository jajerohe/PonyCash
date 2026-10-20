import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Formulario } from "@/components/formulario";
import { MarcoAcceso } from "@/components/marco-acceso";
import { Campo } from "@/components/ui";
import { hayUsuarios } from "@/lib/configuracion";
import { crearPrimerAdmin } from "./actions";

// Primera vez que se abre la app: crear el administrador.
export default async function ConfigurarPage() {
  await connection(); // revisar en cada visita, no guardar la página al compilar
  if (await hayUsuarios()) redirect("/login");

  return (
    <MarcoAcceso titulo="Bienvenido a PonyCash" subtitulo="Crea la cuenta del administrador para empezar">
      <Formulario accion={crearPrimerAdmin} textoBoton="Crear administrador" anchoCompleto>
        <Campo etiqueta="Nombre" name="name" autoComplete="name" required autoFocus />
        <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" required />
        <Campo etiqueta="Contraseña" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <Campo
          etiqueta="Repite la contraseña"
          name="confirmar"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </Formulario>
    </MarcoAcceso>
  );
}
