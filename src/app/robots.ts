import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/discover",
          "/beats",
          "/services",
          "/jam-match"
        ],
        disallow: [
          "/admin",
          "/api",
          "/account",
          "/checkout",
          "/dashboard",
          "/messages",
          "/orders",
          "/upload",
          "/auth"
        ]
      }
    ],
    sitemap: "https://getjamly.com/sitemap.xml",
    host: "https://getjamly.com"
  };
}
