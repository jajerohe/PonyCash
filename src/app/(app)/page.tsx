import Link from "next/link";
import { Tarjeta } from "@/components/ui";
import { requireSession } from "@/lib/session";

export default async function InicioPage() {
  const { user } = await requireSession();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Hola, {user.name.split(" ")[0]} 👋</h1>
      <Tarjeta>
        <p className="text-slate-600">
          Bienvenido a PonyCash. Registra las manillas vendidas en{" "}
          <Link href="/manillas" className="font-medium text-violet-600 hover:underline">
            Manillas
          </Link>
          .
        </p>
      </Tarjeta>
    </div>
  );
}
