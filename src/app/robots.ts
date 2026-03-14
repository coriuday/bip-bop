import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/studio/", "/messages/", "/settings/"],
    },
    sitemap: "https://bipbop.com/sitemap.xml", // Best practice even without a real domain yet
  };
}
