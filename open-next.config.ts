import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Todas las páginas se generan en cada visita, así que no hace falta caché extra.
export default defineCloudflareConfig({});
