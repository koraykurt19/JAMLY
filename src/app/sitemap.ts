import type { MetadataRoute } from "next";

const baseUrl = "https://getjamly.com";

const publicRoutes = [
  "",
  "/discover",
  "/beats",
  "/services",
  "/jam-match",
  "/collab"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7
  }));
}
