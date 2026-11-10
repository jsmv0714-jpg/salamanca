import type { MetadataRoute } from "next";
import { appUrl } from "../lib/email";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cuenta", "/api", "/login", "/registro", "/recuperar", "/restablecer"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
