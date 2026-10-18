// En Cloudflare, copia DATABASE_URL y BETTER_AUTH_SECRET de las variables de
// Build a los secretos de la app (los que usa cuando alguien la visita).
// Así solo hay que configurarlas en un lugar: Settings → Build → Variables and secrets.
import { execFileSync } from "node:child_process";

const NOMBRES = ["DATABASE_URL", "BETTER_AUTH_SECRET"];

if (!process.env.WORKERS_CI) {
  console.log("subir-secretos: fuera de Cloudflare, no se hace nada.");
  process.exit(0);
}

const faltan = NOMBRES.filter((n) => !process.env[n]);
if (faltan.length) {
  console.warn(`⚠️  subir-secretos: faltan en las variables de Build: ${faltan.join(", ")}`);
}

const secretos = Object.fromEntries(
  NOMBRES.filter((n) => process.env[n]).map((n) => [n, process.env[n]]),
);
if (Object.keys(secretos).length === 0) process.exit(0);

try {
  execFileSync("npx", ["wrangler", "secret", "bulk"], {
    input: JSON.stringify(secretos),
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log(`subir-secretos: actualizados ${Object.keys(secretos).join(", ")}.`);
} catch {
  console.warn("⚠️  subir-secretos: no se pudieron actualizar los secretos de la app.");
}
