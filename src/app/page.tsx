import VideoFeed from "./_components/video-feed";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-0 overflow-hidden">
      <VideoFeed />
    </main>
  );
}
