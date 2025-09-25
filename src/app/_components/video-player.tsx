"use client";

import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
}

/**
 * A client-side video player component with custom controls.
 * @param {VideoPlayerProps} props - The props for the component.
 * @param {string} props.src - The URL of the video to play.
 */
export default function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) {
        setVolume(videoRef.current.volume > 0 ? videoRef.current.volume : 0.5);
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain bg-black rounded-lg"
        loop
        onClick={togglePlay}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-30 rounded-lg">
        <button onClick={togglePlay} className="text-white text-4xl">
          {isPlaying ? "❚❚" : "►"}
        </button>
      </div>
      <div className="absolute bottom-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={toggleMute} className="text-white">
          {isMuted || volume === 0 ? "🔇" : "🔊"}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-20 h-1 accent-indigo-500"
        />
      </div>
    </div>
  );
}
