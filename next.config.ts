import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare usa la versión "workerd" del driver de PostgreSQL; hay que incluirla.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pg-cloudflare/dist/**", "./node_modules/pg-cloudflare/esm/**"],
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
