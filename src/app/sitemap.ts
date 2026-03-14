import type { MetadataRoute } from "next";
import { db } from "~/server/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bipbop.com";

  // Get all public videos
  const videos = await db.video.findMany({
    select: { id: true, updatedAt: true },
  });

  // Get all users
  const users = await db.user.findMany({
    select: { username: true, id: true },
  });

  const videoUrls: MetadataRoute.Sitemap = videos.map((video) => ({
    url: `${baseUrl}/?videoId=${video.id}`,
    lastModified: video.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const userUrls: MetadataRoute.Sitemap = users
    .filter((u) => u.username)
    .map((user) => ({
      url: `${baseUrl}/${user.username}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    ...videoUrls,
    ...userUrls,
  ];
}
