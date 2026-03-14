"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Type,
  Music,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface VideoEditorProps {
  videoFile: File;
  onBack: () => void;
  onNext: () => void;
}

export default function VideoEditor({
  videoFile,
  onBack,
  onNext,
}: VideoEditorProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Editor states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTab, setSelectedTab] = useState<
    "text" | "music" | "effects" | "filters"
  >("text");

  // Music track state
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPreviewingTrack, setIsPreviewingTrack] = useState(false);

  // Effect preset state
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);

  // API mutation
  const createVideoMutation = api.video.create.useMutation({
    onSuccess: () => {
      toast.success("Video published successfully!");
      onNext();
      router.push("/");
    },
    onError: (error) => {
      toast.error(`Failed to publish: ${error.message}`);
      setIsUploading(false);
    },
  });

  // Text overlay
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">(
    "center",
  );

  // Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        void videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const editorTabs = [
    { id: "text", label: "Text", icon: Type },
    { id: "music", label: "Music", icon: Music },
    { id: "effects", label: "Effects", icon: Sparkles },
    { id: "filters", label: "Filters", icon: Filter },
  ];

  // Music library data
  const musicTracks = [
    { id: "track_1", title: "Neon Pulse", artist: "Electronic Vibes", duration: "2:34", genre: "Electronic" },
    { id: "track_2", title: "Chill Sunset", artist: "Lo-Fi Dreams", duration: "3:12", genre: "Lo-Fi" },
    { id: "track_3", title: "City Lights", artist: "Urban Beats", duration: "2:48", genre: "Hip-Hop" },
    { id: "track_4", title: "Acoustic Morning", artist: "Folk Tales", duration: "3:05", genre: "Acoustic" },
    { id: "track_5", title: "Summer Pop", artist: "Sunshine Band", duration: "2:21", genre: "Pop" },
    { id: "track_6", title: "Dark Wave", artist: "Synth Underground", duration: "3:47", genre: "Synth" },
  ];

  // Effects presets (CSS filter combos)
  const effectPresets = [
    { id: "none",       label: "Original",   filter: "none" },
    { id: "vintage",   label: "Vintage",     filter: "sepia(0.6) contrast(1.1) brightness(0.9)" },
    { id: "vaporwave", label: "Vaporwave",   filter: "hue-rotate(200deg) saturate(1.8) brightness(1.1)" },
    { id: "cinematic", label: "Cinematic",   filter: "contrast(1.3) saturate(0.8) brightness(0.9)" },
    { id: "noir",      label: "Noir",        filter: "grayscale(1) contrast(1.4) brightness(0.85)" },
    { id: "golden",    label: "Golden Hour", filter: "sepia(0.3) saturate(1.5) brightness(1.1) hue-rotate(-10deg)" },
    { id: "cool",      label: "Cool Tone",   filter: "hue-rotate(180deg) saturate(1.2) brightness(1.05)" },
    { id: "warm",      label: "Warm",        filter: "sepia(0.2) saturate(1.4) brightness(1.05) hue-rotate(10deg)" },
    { id: "dream",     label: "Dream",       filter: "blur(0.5px) brightness(1.1) saturate(1.3) hue-rotate(10deg)" },
  ];

  // Derive the active video filter — effect preset overrides the manual sliders
  const activeVideoFilter = selectedEffect && selectedEffect !== "none"
    ? effectPresets.find((e) => e.id === selectedEffect)?.filter ?? `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
    : `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Video Preview */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl bg-black">
            {/* Video Container */}
            <div className="relative mx-auto aspect-[9/16] max-h-[70vh] bg-black">
              {videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="h-full w-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  muted={isMuted}
                  style={{
                    filter: activeVideoFilter,
                  }}
                />
              )}

              {/* Text Overlay */}
              {textOverlay && (
                <div
                  className={`absolute right-0 left-0 px-4 ${
                    textPosition === "top"
                      ? "top-8"
                      : textPosition === "center"
                        ? "top-1/2 -translate-y-1/2"
                        : "bottom-8"
                  }`}
                >
                  <p
                    className="text-center text-2xl font-bold"
                    style={{
                      color: textColor,
                      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    {textOverlay}
                  </p>
                </div>
              )}

              {/* Play/Pause Overlay */}
              <div
                className="absolute inset-0 flex cursor-pointer items-center justify-center"
                onClick={togglePlay}
              >
                {!isPlaying && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                  >
                    <Play className="ml-1 h-10 w-10 text-white" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Video Controls */}
            <div className="bg-black/50 p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = Number(e.target.value);
                    }
                  }}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
                  style={{
                    background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={togglePlay}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-6 text-xl font-bold">Customize Video</h3>

            {/* Basic Info */}
            <div className="mb-6 space-y-4">
              <Input
                label="Title"
                placeholder="Give your video a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  placeholder="Tell viewers about your video..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Editor Tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto">
              {editorTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 whitespace-nowrap transition-all ${
                      selectedTab === tab.id
                        ? "bg-gradient-to-r from-pink-500 to-cyan-400 text-white"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {selectedTab === "text" && (
                <div className="space-y-4">
                  <Input
                    label="Text Overlay"
                    placeholder="Add text to your video"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                  />
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-10 w-full cursor-pointer rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Position
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["top", "center", "bottom"] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setTextPosition(pos)}
                          className={`rounded-lg px-4 py-2 capitalize transition-all ${
                            textPosition === pos
                              ? "bg-pink-500 text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "music" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 mb-3">Choose a track for your video (royalty-free)</p>
                  {musicTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setSelectedTrack(selectedTrack === track.id ? null : track.id);
                        setIsPreviewingTrack(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        selectedTrack === track.id
                          ? "bg-gradient-to-r from-pink-500/20 to-cyan-400/10 border border-pink-500/40"
                          : "bg-white/5 hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      {/* Play icon area */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          selectedTrack === track.id ? "bg-pink-500" : "bg-white/10"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedTrack === track.id) setIsPreviewingTrack((p) => !p);
                          else { setSelectedTrack(track.id); setIsPreviewingTrack(true); }
                        }}
                      >
                        {selectedTrack === track.id && isPreviewingTrack ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="ml-0.5 h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{track.title}</p>
                        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-xs text-gray-500 block">{track.duration}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400 mt-0.5 inline-block">{track.genre}</span>
                      </div>
                    </button>
                  ))}
                  {selectedTrack && (
                    <p className="text-xs text-pink-400 text-center pt-1">
                      ✓ &quot;{musicTracks.find((t) => t.id === selectedTrack)?.title}&quot; will be added
                    </p>
                  )}
                </div>
              )}

              {selectedTab === "effects" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 mb-3">Apply a visual effect preset (previewed live)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {effectPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedEffect(preset.id === selectedEffect ? null : preset.id);
                          // Reset sliders when an effect is applied
                          if (preset.id !== selectedEffect) {
                            setBrightness(100);
                            setContrast(100);
                            setSaturation(100);
                          }
                        }}
                        className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                          selectedEffect === preset.id
                            ? "ring-2 ring-pink-500 scale-95"
                            : "hover:scale-95"
                        }`}
                      >
                        {videoUrl ? (
                          <video
                            src={videoUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            style={{ filter: preset.filter }}
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{
                              background: `linear-gradient(135deg, #FF2D55, #7B2FFF, #00D4FF)`,
                              filter: preset.filter,
                            }}
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1">
                          <p className="text-xs font-medium text-white text-center">{preset.label}</p>
                        </div>
                        {selectedEffect === preset.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === "filters" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Brightness
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{brightness}%</span>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Contrast
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{contrast}%</span>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Saturation
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">{saturation}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              <Button
                variant="secondary"
                onClick={onBack}
                className="flex-1"
                disabled={isUploading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!title.trim()) {
                    toast.error("Please add a title");
                    return;
                  }

                  setIsUploading(true);

                  // Upload video file first
                  const formData = new FormData();
                  formData.append("file", videoFile);

                  try {
                    const uploadResponse = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });

                    if (!uploadResponse.ok) {
                      throw new Error("Upload failed");
                    }

                    const { filePath } = (await uploadResponse.json()) as {
                      filePath: string;
                    };

                    // Create video record
                    createVideoMutation.mutate({
                      title: title.trim(),
                      description: description.trim() || undefined,
                      filePath,
                      fileSize: videoFile.size,
                    });
                  } catch {
                    toast.error("Failed to upload video");
                    setIsUploading(false);
                  }
                }}
                className="flex-1"
                isLoading={isUploading}
                disabled={isUploading || !title.trim()}
              >
                {isUploading ? "Publishing..." : "Publish"}
                {!isUploading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
