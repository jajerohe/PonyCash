import Link from "next/link";
import { formatearFecha, formatearHora } from "@/lib/fechas";
import { requireSession } from "@/lib/session";
import { cerrarJornada, reabrirJornada } from "../../actions";
import { datosJornada } from "../datos";
import { Planilla } from "./planilla";

export default async function CierrePage({
  params,
  searchParams,
}: {
  params: Promise<{ punto: string }>;
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { user } = await requireSession();
  const { punto, fecha, estado, productos } = await datosJornada(params, searchParams);
  const nombres = new Map(productos.map((p) => [p.id, p.nombre]));

  const filas =
    estado.tipo === "existe" || estado.tipo === "nueva"
      ? estado.filas
          .filter((f) => f.anterior + f.recibidas > 0)
          .map((f) => ({ ...f, nombre: nombres.get(f.productoId) ?? "" }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      : [];
  const cerrada = estado.tipo === "existe" && estado.cerrada;

  const bloqueo =
    estado.tipo === "pendiente"
      ? `Primero hay que cerrar la jornada del ${formatearFecha(estado.fecha)}.`
      : estado.tipo === "posterior"
        ? `Este punto ya tiene una jornada del ${formatearFecha(estado.fecha)}; no se puede registrar una anterior.`
        : null;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <Link href={`/jornada?fecha=${fecha}`} className="text-sm text-marca-600 hover:underline">
          ← Jornada del {formatearFecha(fecha)}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">
          {cerrada ? "Planilla" : "Cierre"} · {punto.nombre} · {formatearFecha(fecha)}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {cerrada && estado.tipo === "existe"
            ? `Cerrada${estado.cerradaEn ? ` a las ${formatearHora(estado.cerradaEn)}` : ""}${estado.cerradaPor ? ` por ${estado.cerradaPor}` : ""}.`
            : "Cuenta las manillas que quedaron. PonyCash calcula las vendidas y las descuenta del inventario general."}
        </p>
      </div>

      {bloqueo ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">{bloqueo}</p>
      ) : (
        <Planilla
          key={String(cerrada)}
          filas={filas}
          cerrada={cerrada}
          accion={cerrarJornada.bind(null, punto.id, fecha)}
          reabrir={cerrada && estado.tipo === "existe" && user.role === "admin" ? reabrirJornada.bind(null, estado.id) : undefined}
        />
      )}
    </div>
  );
}
