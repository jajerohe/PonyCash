import { sql } from "drizzle-orm";
import { getDb } from "@/db";

// Diagnóstico: dice si la app tiene sus variables y si llega a la base de datos.
// No muestra ningún valor secreto.
export async function GET() {
  const estado: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? "configurada" : "FALTA",
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? "configurada" : "FALTA",
  };

  try {
    await getDb().execute(sql`select 1`);
    estado.baseDeDatos = "conectada";
  } catch (error) {
    const e = error as { message?: string; cause?: { message?: string } };
    // Por si el mensaje trae la cadena de conexión, se ocultan las credenciales.
    const mensaje = `${e.message ?? error} ${e.cause?.message ?? ""}`.trim();
    estado.baseDeDatos = "ERROR: " + mensaje.replace(/\/\/[^@\s]*@/g, "//****@");
  }

  return Response.json(estado);
}
