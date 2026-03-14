"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";
import {
  Play,
  Pause,
  Camera,
  Square,
  Upload,
  ArrowLeft,
  Loader2,
  Scissors,
  GitMerge,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import toast from "react-hot-toast";
import Link from "next/link";

type Mode = "duet" | "stitch";

function DuetContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = Number(searchParams.get("videoId") ?? 0);
  const mode: Mode = (searchParams.get("mode") as Mode) ?? "duet";

  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const { data: videoData } = api.video.getFeed.useQuery({ limit: 50 });
  const originalVideo = videoData?.items.find((v) => v.id === videoId);

  const createDuetMutation = api.video.createDuet.useMutation({
    onSuccess: () => {
      toast.success("🎉 Duet posted!");
      router.push("/");
    },
    onError: (e) => toast.error(e.message),
  });

  const createStitchMutation = api.video.createStitch.useMutation({
    onSuccess: () => {
      toast.success("🎉 Stitch posted!");
      router.push("/");
    },
    onError: (e) => toast.error(e.message),
  });

  // Start camera
  useEffect(() => {
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 720, height: 1280 },
          audio: true,
        });
        streamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          await userVideoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        toast.error("Camera access denied. Please allow camera access.");
      }
    })();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Canvas composite loop (side-by-side for duet, stacked for stitch)
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const user = userVideoRef.current;
    const orig = originalVideoRef.current;
    if (!canvas || !user || !orig) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (mode === "duet") {
      // Side-by-side 720x1280 → each half is 360x1280
      canvas.width = 720;
      canvas.height = 1280;
      ctx.drawImage(orig, 0, 0, 360, 1280);
      ctx.drawImage(user, 360, 0, 360, 1280);

      // Label divider
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(360, 0);
      ctx.lineTo(360, 1280);
      ctx.stroke();
    } else {
      // Stitch: original top half, user bottom half
      canvas.width = 720;
      canvas.height = 1280;
      ctx.drawImage(orig, 0, 0, 720, 640);
      ctx.drawImage(user, 0, 640, 720, 640);
    }

    animFrameRef.current = requestAnimationFrame(drawFrame);
  }, [mode]);

  const startRecording = useCallback(() => {
    if (!canvasRef.current || !streamRef.current) return;

    const canvasStream = canvasRef.current.captureStream(30);
    // Add audio from user's mic
    streamRef.current.getAudioTracks().forEach((t) => canvasStream.addTrack(t));

    chunksRef.current = [];
    const mr = new MediaRecorder(canvasStream, { mimeType: "video/webm;codecs=vp9" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setIsRecording(false);
    };

    mr.start();
    mediaRecorderRef.current = mr;
    setIsRecording(true);

    // Start playing the original video
    void originalVideoRef.current?.play();

    // Start drawing
    drawFrame();
  }, [drawFrame]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    originalVideoRef.current?.pause();
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleUpload = async () => {
    if (!recordedBlob || !title.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", recordedBlob, `${mode}_${videoId}.webm`);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");

      if (mode === "duet") {
        createDuetMutation.mutate({
          originalVideoId: videoId,
          title: title.trim(),
          filePath: json.url,
          fileSize: recordedBlob.size,
        });
      } else {
        createStitchMutation.mutate({
          originalVideoId: videoId,
          title: title.trim(),
          filePath: json.url,
          fileSize: recordedBlob.size,
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      setIsUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <p className="text-white/60">Sign in to create a {mode}.</p>
        <Link href="/auth/signin">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  const isPending = createDuetMutation.isPending || createStitchMutation.isPending || isUploading;

  return (
    <div className="flex min-h-screen flex-col items-center bg-black text-white">
      {/* Header */}
      <div className="flex w-full max-w-2xl items-center gap-4 p-4">
        <Link href="/" className="rounded-full p-2 hover:bg-white/10">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-3">
          {mode === "duet" ? (
            <GitMerge className="h-6 w-6 text-pink-400" />
          ) : (
            <Scissors className="h-6 w-6 text-cyan-400" />
          )}
          <h1 className="text-xl font-bold">{mode === "duet" ? "Duet" : "Stitch"}</h1>
        </div>
        <p className="ml-auto text-sm text-white/50">
          {originalVideo?.title ?? `Video #${videoId}`}
        </p>
      </div>

      {/* Canvas / Preview area */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl">
        {/* Original video (hidden, drives the canvas) */}
        {originalVideo && (
          <video
            ref={originalVideoRef}
            src={originalVideo.filePath}
            loop
            muted={false}
            playsInline
            className="hidden"
          />
        )}

        {/* User camera (hidden, drives the canvas) */}
        <video ref={userVideoRef} autoPlay muted playsInline className="hidden" />

        {/* Canvas composite output */}
        <canvas
          ref={canvasRef}
          className="w-full rounded-2xl border border-white/10"
        />

        {/* Recording indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-sm font-bold"
            >
              <motion.div
                className="h-2 w-2 rounded-full bg-white"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              REC
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
          {mode === "duet" ? "Their video | Your camera" : "Their clip ↑ | Your response ↓"}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex w-full max-w-md flex-col items-center gap-6 px-4">
        {!recordedBlob ? (
          <div className="flex flex-col items-center gap-4">
            {!cameraReady && (
              <p className="text-sm text-white/50">
                <Loader2 className="inline h-4 w-4 animate-spin" /> Starting camera...
              </p>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!cameraReady}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 ${
                isRecording
                  ? "border-red-500 bg-red-500/20"
                  : "border-white bg-white/10 hover:bg-white/20"
              } transition-colors disabled:opacity-30`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <Square className="h-8 w-8 fill-red-500 text-red-500" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </button>
            <p className="text-sm text-white/50">
              {isRecording ? "Tap to stop" : "Tap to start recording"}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => setIsPreviewing(!isPreviewing)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 p-3 hover:bg-white/10"
              >
                {isPreviewing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {isPreviewing ? "Pause Preview" : "Preview"}
              </button>
              <button
                onClick={() => setRecordedBlob(null)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 p-3 hover:bg-white/10"
              >
                <Camera className="h-5 w-5" />
                Retry
              </button>
            </div>

            <input
              type="text"
              placeholder={`Add a caption for your ${mode}...`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
            />

            <Button
              variant="primary"
              className="w-full"
              onClick={() => void handleUpload()}
              disabled={isPending || !title.trim()}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Post {mode === "duet" ? "Duet" : "Stitch"}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DuetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      }
    >
      <DuetContent />
    </Suspense>
  );
}
