import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare usa la versión "workerd" del driver de PostgreSQL; hay que incluirla.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pg-cloudflare/dist/**", "./node_modules/pg-cloudflare/esm/**"],
  },
  // Las manillas ahora se llaman productos: las direcciones viejas siguen funcionando.
  async redirects() {
    return [
      { source: "/manillas", destination: "/productos", permanent: true },
      { source: "/manillas-punto-venta", destination: "/productos-punto-venta", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
