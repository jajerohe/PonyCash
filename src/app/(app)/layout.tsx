import Link from "next/link";
import { Logo } from "@/components/logo";
import { Menu, type SeccionMenu } from "@/components/menu";
import { nombreDelRol, requireSession } from "@/lib/session";
import { cerrarSesion } from "../login/actions";

// Marco de todas las páginas internas: menú lateral + contenido.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user } = await requireSession();
  const esAdmin = user.role === "admin";
  const secciones: SeccionMenu[] = [
    { opciones: [{ href: "/", texto: "Inicio" }] },
    // Operaciones queda listo para los módulos que se agreguen.
    { titulo: "Operaciones", opciones: [], mostrarVacio: true },
    {
      titulo: "Administración",
      opciones: [
        ...(esAdmin ? [{ href: "/usuarios", texto: "Usuarios" }] : []),
      ],
    },
  ];

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-crema-100 bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-2">
          <Logo tamano={44} />
          <span className="text-lg font-bold text-marca-800">PonyCash</span>
        </div>

        <Menu secciones={secciones} />

        <div className="mt-auto border-t border-slate-200 pt-4">
          <p className="truncate px-2 text-sm font-medium">{user.name}</p>
          <p className="truncate px-2 text-xs text-slate-500">{user.email}</p>
          <p className="truncate px-2 text-xs text-marca-600">{nombreDelRol(user.role)}</p>
          <Link
            href="/mi-cuenta"
            className="mt-2 block rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Mi cuenta
          </Link>
          <form action={cerrarSesion}>
            <button className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-100">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
