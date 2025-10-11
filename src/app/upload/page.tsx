"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video, Edit3, Music, Type, Sparkles, Check } from "lucide-react";
import VideoUploader from "~/app/_components/video-uploader";
import VideoEditor from "~/app/_components/video-editor";

export default function UploadPage() {
  const [step, setStep] = useState<'upload' | 'edit' | 'publish'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const steps = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'edit', label: 'Edit', icon: Edit3 },
    { id: 'publish', label: 'Publish', icon: Check },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Video</h1>
          <p className="text-gray-400">Upload and customize your video before sharing</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = steps.findIndex(st => st.id === step) > index;
              
              return (
                <div key={s.id} className="flex items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 to-cyan-400 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </motion.div>
                  
                  {index < steps.length - 1 && (
                    <div className="w-24 h-0.5 mx-4 bg-white/10">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-green-500 w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VideoUploader
                onVideoSelect={(file) => {
                  setVideoFile(file);
                  setStep('edit');
                }}
              />
            </motion.div>
          )}

          {step === 'edit' && videoFile && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VideoEditor
                videoFile={videoFile}
                onBack={() => setStep('upload')}
                onNext={() => setStep('publish')}
              />
            </motion.div>
          )}

          {step === 'publish' && (
            <motion.div
              key="publish"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Video Published!</h2>
              <p className="text-gray-400 mb-8">Your video is now live and ready to be discovered</p>
              <button
                onClick={() => {
                  setStep('upload');
                  setVideoFile(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-xl font-semibold"
              >
                Upload Another Video
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
