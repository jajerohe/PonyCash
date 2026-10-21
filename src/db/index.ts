import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";
import * as schema from "./schema";

// En Cloudflare cada visita debe abrir su propia conexión: no se puede
// reutilizar una conexión de otra visita. `cache` hace que toda la página
// use el mismo pool, y `max: 1` que ese pool tenga una sola conexión: cada
// conexión nueva a Neon cuesta CPU (cifrado y contraseña) y Cloudflare
// corta la visita si se pasa del límite (error 1102).
export const getDb = cache(() => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  // Cloudflare cierra la conexión al terminar la visita; no es un error real.
  pool.on("error", (error) => {
    if (!/closed|closing/.test(error.message)) console.error(error);
  });
  return drizzle({ client: pool, schema });
});
