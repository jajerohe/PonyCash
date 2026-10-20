import { Menu, type SeccionMenu } from "@/components/menu";
import { getAcceso } from "@/lib/accesos";
import { cerrarSesion } from "../login/actions";

// Marco de todas las páginas internas: menú lateral + contenido.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { session, perfil, puede } = await getAcceso();
  const { user } = session;
  const secciones: SeccionMenu[] = [
    { opciones: [{ href: "/", texto: "Inicio" }] },
    {
      titulo: "Operaciones",
      opciones: [
        ...(puede("categorias.ver") ? [{ href: "/categorias", texto: "Categorías" }] : []),
        ...(puede("subcategorias.ver") ? [{ href: "/subcategorias", texto: "Subcategorías" }] : []),
        ...(puede("inventario.ver") ? [{ href: "/inventario", texto: "Inventario" }] : []),
      ],
    },
    {
      titulo: "Administración",
      opciones: [
        ...(puede("usuarios.ver") ? [{ href: "/usuarios", texto: "Usuarios" }] : []),
        ...(puede("perfiles.ver") ? [{ href: "/perfiles", texto: "Perfiles" }] : []),
      ],
    },
  ];

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 font-bold text-white">
            P
          </div>
          <span className="text-lg font-bold">PonyCash</span>
        </div>

        <Menu secciones={secciones} />

        <div className="mt-auto border-t border-slate-200 pt-4">
          <p className="truncate px-2 text-sm font-medium">{user.name}</p>
          <p className="truncate px-2 text-xs text-slate-500">{user.email}</p>
          <p className="truncate px-2 text-xs text-violet-600">{perfil?.nombre ?? "Sin perfil"}</p>
          <form action={cerrarSesion}>
            <button className="mt-2 w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-100">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
