import { Tarjeta } from "@/components/ui";
import { requireSession } from "@/lib/session";

export default async function InicioPage() {
  const { user } = await requireSession();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Hola, {user.name.split(" ")[0]} 👋</h1>
      <Tarjeta>
        <p className="text-slate-600">
          Bienvenido a PonyCash. Aquí irán tus cuentas, ingresos y gastos.
        </p>
      </Tarjeta>
    </div>
  );
}
