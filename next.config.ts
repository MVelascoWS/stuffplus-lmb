import type { NextConfig } from "next";

// Sitio estático: `next build` genera la carpeta out/ y todo el cálculo ocurre en el navegador.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
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
