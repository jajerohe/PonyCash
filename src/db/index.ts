import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";
import * as schema from "./schema";

// En Cloudflare cada visita debe abrir su propia conexión: no se puede
// reutilizar una conexión de otra visita. `cache` evita abrir varias
// durante la misma página.
export const getDb = cache(() => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, maxUses: 1 });
  // Cloudflare cierra la conexión al terminar la visita; no es un error real.
  pool.on("error", (error) => {
    if (!/closed|closing/.test(error.message)) console.error(error);
  });
  return drizzle({ client: pool, schema });
});
