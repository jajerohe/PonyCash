import Link from "next/link";
import { Formulario } from "@/components/formulario";
import { MarcoAcceso } from "@/components/marco-acceso";
import { Campo } from "@/components/ui";
import { solicitarRecuperacion } from "./actions";

// "¿Olvidaste tu contraseña?": pide el correo y envía un enlace para crear una nueva.
export default function RecuperarPage() {
  return (
    <MarcoAcceso
      subtitulo="Recupera tu contraseña"
      pie={
        <Link href="/login" className="text-marca-600 hover:underline">
          ← Volver a iniciar sesión
        </Link>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Escribe el correo con el que entras a PonyCash y te enviaremos un enlace para crear una contraseña nueva.
      </p>
      <Formulario accion={solicitarRecuperacion} textoBoton="Enviar enlace" anchoCompleto>
        <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" required autoFocus />
      </Formulario>
    </MarcoAcceso>
  );
}
