import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { producto, tarifa, tipoTarifa } from "@/db/schema";
import { hoy, vigencia } from "@/lib/fechas";
import { requireSession } from "@/lib/session";
import { ListadoTarifas } from "./listado";

export default async function TarifasPage() {
  const { user } = await requireSession();
  const db = getDb();
  const [filas, productos, tipos] = await Promise.all([
    db
      .select({
        id: tarifa.id,
        productoId: tarifa.productoId,
        producto: producto.nombre,
        tipoTarifaId: tarifa.tipoTarifaId,
        tipo: tipoTarifa.nombre,
        valor: tarifa.valor,
        desde: tarifa.desde,
        hasta: tarifa.hasta,
        activa: tarifa.activa,
        predeterminada: tarifa.predeterminada,
      })
      .from(tarifa)
      .innerJoin(producto, eq(tarifa.productoId, producto.id))
      .innerJoin(tipoTarifa, eq(tarifa.tipoTarifaId, tipoTarifa.id))
      // Por producto; dentro de cada una, la predeterminada primero y luego las más recientes.
      .orderBy(asc(producto.nombre), desc(tarifa.predeterminada), desc(tarifa.desde)),
    db.select({ id: producto.id, nombre: producto.nombre, activa: producto.activa }).from(producto).orderBy(asc(producto.nombre)),
    db
      .select({ id: tipoTarifa.id, nombre: tipoTarifa.nombre, activa: tipoTarifa.activa })
      .from(tipoTarifa)
      .orderBy(desc(tipoTarifa.protegido), asc(tipoTarifa.nombre)),
  ]);

  // La vigencia se calcula aquí con la fecha de Colombia.
  const dia = hoy();
  const tarifas = filas.map((t) => ({ ...t, vigencia: vigencia(t.desde, t.hasta, dia) }));

  return <ListadoTarifas tarifas={tarifas} productos={productos} tipos={tipos} puedeEditar={user.role === "admin"} />;
}
