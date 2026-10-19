import { Formulario } from "@/components/formulario";
import { Campo } from "@/components/ui";
import { MODULOS } from "@/lib/permisos";
import { guardarPerfil } from "./actions";

// Nombre, descripción y una casilla por cada opción de cada módulo.
export function FormularioPerfil({
  perfil,
  permisos,
  soloLectura,
}: {
  perfil?: { id: number; nombre: string; descripcion: string | null; esAdministrador: boolean };
  permisos?: Set<string>;
  soloLectura: boolean;
}) {
  const todos = perfil?.esAdministrador ?? false;
  const bloqueadas = soloLectura || todos;

  const contenido = (
    <>
      <input type="hidden" name="id" value={perfil?.id ?? 0} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" name="nombre" defaultValue={perfil?.nombre} placeholder="Ej: Taquilla" required disabled={soloLectura} />
        <Campo etiqueta="Descripción (opcional)" name="descripcion" defaultValue={perfil?.descripcion ?? ""} disabled={soloLectura} />
      </div>

      {todos && (
        <p className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-700">
          Este perfil tiene acceso total: siempre puede usar todos los módulos y opciones, incluidos los que se agreguen después.
        </p>
      )}

      <div className="space-y-3">
        {MODULOS.map((m) => (
          <fieldset key={m.clave} className="rounded-xl border border-slate-200 p-4">
            <legend className="px-1 font-semibold">{m.nombre}</legend>
            <p className="mb-3 text-xs text-slate-500">{m.descripcion}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {m.opciones.map((o) => {
                const clave = `${m.clave}.${o.clave}`;
                return (
                  <label key={clave} className={`flex items-center gap-2 text-sm ${bloqueadas ? "text-slate-500" : ""}`}>
                    <input
                      type="checkbox"
                      name="permiso"
                      value={clave}
                      defaultChecked={todos || permisos?.has(clave)}
                      disabled={bloqueadas}
                      className="h-4 w-4 accent-violet-600"
                    />
                    {o.nombre}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </>
  );

  if (soloLectura) return <div className="space-y-4">{contenido}</div>;
  return (
    <Formulario accion={guardarPerfil} textoBoton={perfil ? "Guardar perfil" : "Crear perfil"}>
      {contenido}
    </Formulario>
  );
}
