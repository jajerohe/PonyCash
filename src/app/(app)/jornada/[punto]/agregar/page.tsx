import Link from "next/link";
import { getDb } from "@/db";
import { formatearFecha } from "@/lib/fechas";
import { existencias, manillasEnPuntos, totalEnPuntos } from "@/lib/inventario";
import { requireSession } from "@/lib/session";
import { registrarEntrega } from "../../actions";
import { datosJornada } from "../datos";
import { FormularioEntrega } from "./formulario";

export default async function AgregarPage({
  params,
  searchParams,
}: {
  params: Promise<{ punto: string }>;
  searchParams: Promise<{ fecha?: string }>;
}) {
  await requireSession();
  const { punto, fecha, estado, productos, habilitados } = await datosJornada(params, searchParams);
  const db = getDb();
  const [existencia, enPuntos] = await Promise.all([existencias(db), manillasEnPuntos(db)]);
  const porProducto = totalEnPuntos(enPuntos);

  const filas = estado.tipo === "existe" || estado.tipo === "nueva" ? estado.filas : [];
  const tiene = new Map(filas.map((f) => [f.productoId, f.anterior + f.recibidas]));
  // Los productos habilitados en el punto, más los que ya tenga aunque no lo estén.
  const lista = productos
    .filter((p) => (p.activa && habilitados.has(p.id)) || (tiene.get(p.id) ?? 0) > 0)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      tiene: tiene.get(p.id) ?? 0,
      bodega: Math.max((existencia.get(p.id) ?? 0) - (porProducto.get(p.id) ?? 0), 0),
    }));

  const bloqueo =
    estado.tipo === "pendiente"
      ? `Primero hay que cerrar la jornada del ${formatearFecha(estado.fecha)}.`
      : estado.tipo === "posterior"
        ? `Este punto ya tiene una jornada del ${formatearFecha(estado.fecha)}; no se puede registrar una anterior.`
        : estado.tipo === "existe" && estado.cerrada
          ? "La jornada de este día ya está cerrada."
          : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href={`/jornada?fecha=${fecha}`} className="text-sm text-marca-600 hover:underline">
          ← Jornada del {formatearFecha(fecha)}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Agregar manillas · {punto.nombre}</h1>
        <p className="mt-1 text-sm text-slate-500">
          El punto conserva lo que le quedó; aquí solo se registra lo que se le entrega de más. No descuenta del inventario general.
        </p>
      </div>

      {bloqueo ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">{bloqueo}</p>
      ) : lista.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Este punto no tiene productos habilitados. Habilítalos en Configuración → Productos por Punto de Venta.
        </p>
      ) : (
        <FormularioEntrega productos={lista} accion={registrarEntrega.bind(null, punto.id, fecha)} />
      )}
    </div>
  );
}
