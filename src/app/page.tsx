import type { Metadata } from "next";
import { db } from "~/server/db";
import VideoFeed from "./_components/video-feed";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { videoId } = await searchParams;
  
  if (videoId && typeof videoId === "string") {
    const video = await db.video.findUnique({
      where: { id: parseInt(videoId, 10) },
      include: { user: true },
    });
    
    if (video) {
      const title = `${video.title ?? "Video"} | BipBop`;
      const description = video.description ?? `Watch this video by @${video.user.username ?? "user"} on BipBop`;
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          images: video.thumbnailUrl ? [{ url: video.thumbnailUrl }] : [],
          type: "video.other",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: video.thumbnailUrl ? [video.thumbnailUrl] : [],
        },
      };
    }
  }

  return {
    title: "BipBop | Short-form Videos",
    description: "Discover and share short-form videos with the world.",
  };
}
export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-0 overflow-hidden">
      <VideoFeed />
    </main>
  );
}
