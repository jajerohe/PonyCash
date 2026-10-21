import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { manilla, tarifa, tipoTarifa } from "@/db/schema";
import { hoy, vigencia } from "@/lib/fechas";
import { requireSession } from "@/lib/session";
import { ListadoTarifas } from "./listado";

export default async function TarifasPage() {
  const { user } = await requireSession();
  const db = getDb();
  const [filas, manillas, tipos] = await Promise.all([
    db
      .select({
        id: tarifa.id,
        manillaId: tarifa.manillaId,
        manilla: manilla.nombre,
        tipoTarifaId: tarifa.tipoTarifaId,
        tipo: tipoTarifa.nombre,
        valor: tarifa.valor,
        desde: tarifa.desde,
        hasta: tarifa.hasta,
        activa: tarifa.activa,
        predeterminada: tarifa.predeterminada,
      })
      .from(tarifa)
      .innerJoin(manilla, eq(tarifa.manillaId, manilla.id))
      .innerJoin(tipoTarifa, eq(tarifa.tipoTarifaId, tipoTarifa.id))
      // Por manilla; dentro de cada una, la predeterminada primero y luego las más recientes.
      .orderBy(asc(manilla.nombre), desc(tarifa.predeterminada), desc(tarifa.desde)),
    db.select({ id: manilla.id, nombre: manilla.nombre, activa: manilla.activa }).from(manilla).orderBy(asc(manilla.nombre)),
    db
      .select({ id: tipoTarifa.id, nombre: tipoTarifa.nombre, activa: tipoTarifa.activa })
      .from(tipoTarifa)
      .orderBy(desc(tipoTarifa.protegido), asc(tipoTarifa.nombre)),
  ]);

  // La vigencia se calcula aquí con la fecha de Colombia.
  const dia = hoy();
  const tarifas = filas.map((t) => ({ ...t, vigencia: vigencia(t.desde, t.hasta, dia) }));

  return <ListadoTarifas tarifas={tarifas} manillas={manillas} tipos={tipos} puedeEditar={user.role === "admin"} />;
}
