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
  X,
  GitMerge,
  Scissors,
  Send,
  Loader2
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Avatar } from "~/components/ui/avatar";

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
      icon: GitMerge,
      label: "Duet with this video",
      onClick: () => router.push(`/duet?videoId=${videoId}&mode=duet`),
      show: true,
    },
    {
      icon: Scissors,
      label: "Stitch this video",
      onClick: () => router.push(`/duet?videoId=${videoId}&mode=stitch`),
      show: true,
    },
    {
      icon: Send,
      label: "Send in Message",
      onClick: () => {
        setIsOpen(false);
        if (!session?.user) {
          toast.error("Please sign in to send messages");
          return;
        }
        setShowShareModal(true);
      },
      show: true,
    },
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

      <ShareToMessageModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        videoId={videoId}
      />
    </>
  );
}

function ShareToMessageModal({ isOpen, onClose, videoId }: { isOpen: boolean, onClose: () => void, videoId: number }) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const { data: conversations, isLoading } = api.message.getConversations.useQuery(undefined, {
    enabled: isOpen && !!session?.user,
  });

  const shareMutation = api.message.shareVideo.useMutation({
    onSuccess: async () => {
      toast.success("Video sent!");
      await utils.message.getConversations.invalidate();
      onClose();
      setSelectedConvId(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setSelectedConvId(null);
    }
  });

  const handleSend = (convId: string) => {
    if (shareMutation.isPending) return;
    setSelectedConvId(convId);
    shareMutation.mutate({
      conversationId: convId,
      videoId,
      comment: "Shared a video",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[60] bg-[#1a1a1a] rounded-t-3xl max-h-[80vh] flex flex-col"
          >
            <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <h3 className="text-white text-lg font-semibold">Send to...</h3>
              <button onClick={onClose} className="text-white/60 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 h-[50vh]">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                </div>
              ) : !conversations?.length ? (
                <div className="text-center py-10 text-white/50">
                  No previous conversations.<br/>
                  Go to Messages to start chatting!
                </div>
              ) : (
                <div className="space-y-2 flex flex-col">
                  {conversations.map((conv) => {
                    const title = conv.otherParticipant?.name ?? "User";
                    const avatar = conv.otherParticipant?.image;
                    
                    const isSendingThis = shareMutation.isPending && selectedConvId === conv.id;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSend(conv.id)}
                        disabled={shareMutation.isPending}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar size="md" src={avatar ?? undefined} fallback={title.charAt(0)} />
                          <div className="text-left">
                            <p className="font-medium text-white text-sm">{title}</p>
                            {conv.lastMessage && (
                              <p className="text-xs text-white/50 mt-0.5 truncate max-w-[200px]">
                                {conv.lastMessage.senderId === session?.user?.id ? "You: " : ""}
                                {conv.lastMessage.mediaUrl ? 'Shared a video' : conv.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="shrink-0 flex items-center justify-center w-10">
                           {isSendingThis ? (
                             <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                           ) : (
                             <div className="h-8 px-4 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium group-hover:bg-white/20 transition-colors">
                               Send
                             </div>
                           )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
