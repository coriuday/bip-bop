"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useGesture } from "@use-gesture/react";
import { api } from "~/trpc/react";
import VideoCard from "./video-card";
import { Loader2 } from "lucide-react";

/**
 * TikTok-style vertical-snapping video feed.
 * Supports: scroll-snap, keyboard arrow keys, and swipe gestures (touch + mouse).
 */
export default function VideoFeed() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const { data, fetchNextPage, hasNextPage, isLoading, isError } =
    api.video.getFeed.useInfiniteQuery(
      { limit: 5 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const { ref: bottomRef, inView } = useInView({ threshold: 0.5 });
  const videos = data?.pages.flatMap((page) => page.items) ?? [];

  // Fetch next page when bottom sentinel is visible
  useEffect(() => {
    if (inView && hasNextPage) void fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const containerRef = useRef<HTMLDivElement>(null);
  // Whether we're currently animating a snap (prevents rapid double-swipes)
  const isSnappingRef = useRef(false);

  // Snap container to a specific video index
  const snapToVideo = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container || isSnappingRef.current) return;
    const clamped = Math.max(0, Math.min(index, videos.length - 1));
    if (clamped === activeVideoIndex && index === clamped) return;

    isSnappingRef.current = true;
    container.scrollTo({ top: clamped * window.innerHeight, behavior: "smooth" });
    setActiveVideoIndex(clamped);

    // Release lock after animation completes
    setTimeout(() => { isSnappingRef.current = false; }, 600);
  }, [activeVideoIndex, videos.length]);

  // ── Scroll → snap logic ─────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let timer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const idx = Math.round(container.scrollTop / window.innerHeight);
        if (idx !== activeVideoIndex) {
          setActiveVideoIndex(Math.max(0, Math.min(idx, videos.length - 1)));
        }
        isSnappingRef.current = false;
      }, 120);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => { container.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, [activeVideoIndex, videos.length]);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") snapToVideo(activeVideoIndex + 1);
      if (e.key === "ArrowUp")   snapToVideo(activeVideoIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeVideoIndex, snapToVideo]);

  // ── Touch / Mouse swipe gestures ─────────────────────────────────────────
  // We attach the gesture to the outer wrapper (not the scrollable container)
  // and intercept fast vertical flicks to jump to the next/prev video.
  const bind = useGesture(
    {
      onDrag: ({ direction: [, dy], velocity: [, vy], distance: [, dist], cancel }) => {
        // Only act on deliberate, mostly-vertical swipes
        const isFast = Math.abs(vy) > 0.4;
        const isFar  = Math.abs(dist) > window.innerHeight * 0.18;

        if (isFast || isFar) {
          if (dy < 0) snapToVideo(activeVideoIndex + 1); // swipe up → next
          else        snapToVideo(activeVideoIndex - 1); // swipe down → prev
          cancel();
        }
      },
    },
    {
      drag: {
        axis: "y",
        filterTaps: true,
        pointer: { touch: true },
        // Prevent browser rubber-band scroll fighting
        eventOptions: { passive: false },
      },
    }
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen w-full overflow-hidden flex items-center justify-center bg-[#0a0a0a] relative">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-[#FF2D55] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-[#7B2FFF] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse-glow" style={{ animationDelay: "1s" }} />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF2D55] to-[#7B2FFF] rounded-full blur-xl opacity-50 animate-pulse-glow" />
            <div className="relative bg-white/5 p-5 rounded-full border border-white/20 backdrop-blur-xl">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
          <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Loading Feed</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] gap-3">
        <p className="text-[#FF2D55] text-xl font-semibold">Oops! Something went wrong</p>
        <p className="text-white/50 text-sm">Unable to load videos. Try refreshing.</p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-center px-6 max-w-2xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF2D55] to-[#00D4FF] rounded-3xl blur-3xl opacity-20 animate-pulse-glow" />
              <div className="relative bg-gradient-to-br from-[#FF2D55]/10 to-[#00D4FF]/10 p-12 rounded-3xl border border-white/10">
                <svg className="w-24 h-24 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">No videos yet</h1>
            <p className="text-lg text-white/50 mb-10 max-w-md mx-auto">
              Be the first to share your creativity. Upload your first video and start your journey!
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#FF2D55] to-[#7B2FFF] rounded-xl font-semibold text-white text-lg shadow-2xl shadow-[#FF2D55]/20 hover:shadow-[#FF2D55]/40 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Upload Your First Video
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Feed ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative h-screen w-full bg-black overflow-hidden touch-none"
      {...bind()}
    >
      {/* Scrollable snap container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ touchAction: "none" }} // gesture handler takes over
      >
        {videos.map((video, index) => (
          <div key={video.id} className="h-screen w-full snap-start snap-always">
            <VideoCard
              id={video.id}
              videoUrl={video.filePath}
              thumbnailUrl={video.thumbnailUrl ?? undefined}
              username={video.user.username ?? video.user.name ?? "Anonymous"}
              userId={video.user.id}
              description={video.description ?? video.title ?? ""}
              likesCount={video._count.likes}
              commentsCount={video._count.comments}
              viewsCount={video.viewCount}
              isLiked={video.userHasLiked}
              isBookmarked={video.userHasBookmarked}
              isActive={index === activeVideoIndex}
            />
          </div>
        ))}

        {/* Load-more sentinel */}
        {hasNextPage && (
          <div ref={bottomRef} className="h-20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
          </div>
        )}
      </div>

      {/* Swipe hint on first visit */}
      <AnimatePresence>
        {activeVideoIndex === 0 && videos.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1"
            aria-hidden="true"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.2, repeat: 3, ease: "easeInOut" }}
            >
              <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </motion.div>
            <p className="text-white/40 text-xs tracking-wide">Swipe up</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
