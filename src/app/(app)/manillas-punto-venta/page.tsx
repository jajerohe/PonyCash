import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { manilla, puntoVenta, puntoVentaManilla } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { ManillasPorPunto } from "./asignacion";

export default async function ManillasPuntoVentaPage() {
  const { user } = await requireSession();
  const db = getDb();
  const [puntos, manillas, asignaciones] = await Promise.all([
    db
      .select({ id: puntoVenta.id, nombre: puntoVenta.nombre, descripcion: puntoVenta.descripcion, activa: puntoVenta.activa })
      .from(puntoVenta)
      .orderBy(asc(puntoVenta.nombre)),
    db.select({ id: manilla.id, nombre: manilla.nombre, activa: manilla.activa }).from(manilla).orderBy(asc(manilla.nombre)),
    db.select({ puntoVentaId: puntoVentaManilla.puntoVentaId, manillaId: puntoVentaManilla.manillaId }).from(puntoVentaManilla),
  ]);

  return (
    <ManillasPorPunto
      puntos={puntos}
      manillas={manillas}
      asignaciones={asignaciones}
      puedeEditar={user.role === "admin"}
    />
  );
}
