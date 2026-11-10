import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Las hojas de vida se envían con el formulario (máximo 4 MB): se deja margen para el resto de campos.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Sin esto, Turbopack vigila la carpeta superior (C:\Users\...): cualquier archivo
    // ajeno al proyecto provoca recargas constantes de la página en desarrollo.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
