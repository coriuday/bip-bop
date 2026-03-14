"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Heart,
  MessageCircle,
  Users,
  Camera,
  X,
  Send,
  Loader2,
  Eye,
} from "lucide-react";
import { Avatar } from "~/components/ui/avatar";
import { getPusherClient } from "~/lib/pusher";
import toast from "react-hot-toast";
import Link from "next/link";

interface LiveComment {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  timestamp: number;
}

interface HeartAnimation {
  id: string;
  x: number;
}

export default function LivePage() {
  const { data: session } = useSession();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pusherRef = useRef<ReturnType<typeof getPusherClient> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);

  const [isLive, setIsLive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [hearts, setHearts] = useState<HeartAnimation[]>([]);
  const [liveRoomId] = useState<string>(() => `live_${session?.user?.id ?? "anon"}`);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Scroll comments to bottom
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Start camera preview  
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch {
      toast.error("Could not access camera. Please check permissions.");
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // Pusher real-time setup for live room
  const goLive = useCallback(() => {
    if (!session?.user) {
      toast.error("Sign in to go live.");
      return;
    }

    const pusher = getPusherClient();
    pusherRef.current = pusher;
    // We use a public channel (presence channels need Pusher auth which is expensive to set up)
    const channel = pusher.subscribe(`live-${liveRoomId}`);
    channelRef.current = channel;

    channel.bind("live:comment", (data: LiveComment) => {
      setComments((prev) => [...prev.slice(-99), data]);
    });

    channel.bind("live:heart", () => {
      setLikeCount((c) => c + 1);
      const id = `h-${Date.now()}-${Math.random()}`;
      const x = 20 + Math.random() * 60; // % from left
      setHearts((prev) => [...prev, { id, x }]);
      setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 2500);
    });

    channel.bind("live:join", () => setViewerCount((c) => c + 1));
    channel.bind("live:leave", () => setViewerCount((c) => Math.max(0, c - 1)));

    // Announce join
    void fetch("/api/pusher-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: `live-${liveRoomId}`, event: "live:join", data: {} }),
    });

    setIsLive(true);
    toast.success("You are now LIVE! 🔴");
  }, [session, liveRoomId]);

  const stopLive = useCallback(() => {
    void fetch("/api/pusher-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: `live-${liveRoomId}`, event: "live:leave", data: {} }),
    });
    pusherRef.current?.unsubscribe(`live-${liveRoomId}`);
    setIsLive(false);
    toast("Stream ended.", { icon: "📺" });
  }, [liveRoomId]);

  const sendHeart = useCallback(() => {
    void fetch("/api/pusher-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: `live-${liveRoomId}`, event: "live:heart", data: {} }),
    });
  }, [liveRoomId]);

  const sendComment = useCallback(async () => {
    if (!commentText.trim() || !session?.user) return;
    const comment: LiveComment = {
      id: `c-${Date.now()}`,
      userId: session.user.id ?? "",
      username: session.user.username ?? session.user.name ?? "User",
      avatar: session.user.image ?? undefined,
      text: commentText.trim(),
      timestamp: Date.now(),
    };

    await fetch("/api/pusher-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: `live-${liveRoomId}`, event: "live:comment", data: comment }),
    });

    setCommentText("");
  }, [commentText, session, liveRoomId]);

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <Radio className="h-16 w-16 text-pink-500" />
        <p className="text-xl font-bold">BipBop LIVE</p>
        <p className="text-white/60">Sign in to go live or watch streams.</p>
        <Link href="/auth/signin" className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-2 font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* Background camera feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4 z-10">
        <div className="flex items-center gap-3">
          <Avatar
            src={session.user.image ?? undefined}
            fallback={(session.user.name ?? "U").charAt(0).toUpperCase()}
            size="sm"
          />
          <div>
            <p className="font-semibold text-sm">{session.user.name}</p>
            <p className="text-xs text-white/60">@{session.user.username ?? "you"}</p>
          </div>

          {isLive && (
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold"
            >
              <div className="h-2 w-2 rounded-full bg-white" />
              LIVE
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm backdrop-blur-sm">
              <Eye className="h-4 w-4 text-white/70" />
              <span>{viewerCount}</span>
            </div>
          )}
          <button
            onClick={isLive ? stopLive : undefined}
            className="rounded-full bg-black/60 p-2 backdrop-blur-sm hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Floating hearts */}
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -300, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-32 z-20 text-3xl"
            style={{ left: `${h.x}%` }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Right sidebar actions */}
      {isLive && (
        <div className="absolute bottom-32 right-4 z-10 flex flex-col items-center gap-5">
          <button
            onClick={sendHeart}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Heart className="h-6 w-6 text-pink-400 fill-pink-400" />
            </div>
            <span className="text-xs font-bold">{likeCount}</span>
          </button>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-white/70">{comments.length}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-white/70">{viewerCount}</span>
          </div>
        </div>
      )}

      {/* Comments feed */}
      {isLive && (
        <div className="absolute bottom-20 left-4 z-10 max-h-64 w-[65%] space-y-2 overflow-y-hidden">
          <AnimatePresence>
            {comments.slice(-8).map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2"
              >
                <Avatar
                  src={c.avatar}
                  fallback={c.username.charAt(0).toUpperCase()}
                  size="sm"
                />
                <div className="rounded-2xl rounded-bl-none bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-bold text-pink-400">@{c.username} </span>
                  <span className="text-xs text-white">{c.text}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={commentsEndRef} />
        </div>
      )}

      {/* Comment input */}
      {isLive && (
        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-3">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void sendComment(); }}
            placeholder="Say something..."
            className="flex-1 rounded-full border border-white/20 bg-black/60 px-4 py-3 text-sm placeholder-white/40 backdrop-blur-sm focus:border-pink-500 focus:outline-none"
          />
          <button
            onClick={() => void sendComment()}
            disabled={!commentText.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Go Live / camera ready CTA */}
      {!isLive && (
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          {isCameraReady ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-black/60 px-6 py-4 backdrop-blur-sm">
                <Camera className="h-6 w-6 text-green-400" />
                <span className="font-medium">Camera ready</span>
              </div>
              <button
                onClick={goLive}
                className="flex items-center gap-3 rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-10 py-4 text-lg font-bold shadow-lg shadow-pink-500/30 transition-transform hover:scale-105 active:scale-95"
              >
                <Radio className="h-6 w-6" />
                Go LIVE
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              <p className="text-white/60">Starting camera...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
