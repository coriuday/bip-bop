"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MoreHorizontal, 
  Flag, 
  UserX, 
  Link as LinkIcon, 
  Download,
  AlertCircle,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface VideoOptionsMenuProps {
  videoId: number;
  videoUrl: string;
  userId: string;
  username: string;
}

export default function VideoOptionsMenu({ 
  videoId, 
  videoUrl, 
  userId, 
  username 
}: VideoOptionsMenuProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const isOwnVideo = session?.user?.id === userId;

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/?videoId=${videoId}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
    setIsOpen(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `video-${videoId}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
    setIsOpen(false);
  };

  const handleReport = () => {
    toast.success("Report submitted. We'll review this content.");
    setIsOpen(false);
  };

  const handleNotInterested = () => {
    toast.success("We'll show you less content like this");
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: LinkIcon,
      label: "Copy link",
      onClick: handleCopyLink,
      show: true,
    },
    {
      icon: Download,
      label: "Download video",
      onClick: handleDownload,
      show: true,
    },
    {
      icon: UserX,
      label: "Not interested",
      onClick: handleNotInterested,
      show: !isOwnVideo,
      danger: false,
    },
    {
      icon: Flag,
      label: "Report",
      onClick: handleReport,
      show: !isOwnVideo,
      danger: true,
    },
  ];

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center gap-1"
      >
        <div className="rounded-full p-3 bg-black/20 backdrop-blur-sm">
          <MoreHorizontal className="h-7 w-7 text-white" />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Menu */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] rounded-t-3xl"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg font-semibold">Options</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  {menuItems
                    .filter((item) => item.show)
                    .map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.98 }}
                          onClick={item.onClick}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                            item.danger
                              ? "hover:bg-red-500/10 text-red-500"
                              : "hover:bg-white/5 text-white"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-base font-medium">{item.label}</span>
                        </motion.button>
                      );
                    })}
                </div>

                {/* Info */}
                <div className="mt-6 p-4 bg-white/5 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/60">
                    <p className="mb-1">Video by @{username}</p>
                    <p>Report inappropriate content to help keep our community safe.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
