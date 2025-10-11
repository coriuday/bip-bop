"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, Video, FileVideo } from "lucide-react";

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
}

export default function VideoUploader({ onVideoSelect }: VideoUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      onVideoSelect(acceptedFiles[0]);
    }
  }, [onVideoSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all hover:scale-[1.01] ${
          isDragActive
            ? 'border-pink-500 bg-pink-500/10'
            : 'border-white/20 hover:border-white/40 bg-white/5'
        }`}
      >
        <input {...getInputProps()} />
        
        {/* Icon */}
        <motion.div
          animate={{
            y: isDragActive ? -10 : 0,
          }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-cyan-400/20 flex items-center justify-center">
            {isDragActive ? (
              <FileVideo className="w-12 h-12 text-pink-500" />
            ) : (
              <Upload className="w-12 h-12 text-white/60" />
            )}
          </div>
        </motion.div>

        {/* Text */}
        <h3 className="text-2xl font-bold mb-2 text-white">
          {isDragActive ? 'Drop your video here' : 'Upload a video'}
        </h3>
        <p className="text-gray-400 mb-6">
          Drag and drop or click to browse
        </p>

        {/* Specs */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            <span>MP4, MOV, AVI</span>
          </div>
          <div className="flex items-center gap-2">
            <span>•</span>
            <span>Max 500MB</span>
          </div>
          <div className="flex items-center gap-2">
            <span>•</span>
            <span>Up to 10 minutes</span>
          </div>
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-xl font-semibold text-white"
        >
          Select Video
        </motion.button>
      </div>

      {/* Tips */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '🎬', title: 'High Quality', desc: 'Upload in 1080p or higher' },
          { icon: '⏱️', title: 'Keep it Short', desc: 'Best videos are under 60 seconds' },
          { icon: '🎵', title: 'Add Music', desc: 'Make it more engaging' },
        ].map((tip) => (
          <div
            key={tip.title}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="text-2xl mb-2">{tip.icon}</div>
            <h4 className="font-semibold mb-1 text-white">{tip.title}</h4>
            <p className="text-sm text-gray-400">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
