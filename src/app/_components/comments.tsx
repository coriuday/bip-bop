"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Heart, MessageCircle } from "lucide-react";
import { formatTimeAgo } from "~/lib/utils";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface CommentsProps {
  videoId: number;
  initialComments?: Comment[];
  onCommentAdded?: () => void;
}

export default function Comments({ videoId, initialComments = [], onCommentAdded }: CommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [commentText, setCommentText] = useState("");

  const { data: fetchedComments, isLoading } = api.comment.getByVideoId.useQuery(
    { videoId },
    {
      enabled: initialComments.length === 0,
    }
  );

  // Update comments when data is fetched
  useEffect(() => {
    if (fetchedComments) {
      setComments(fetchedComments);
    }
  }, [fetchedComments]);

  const createCommentMutation = api.comment.create.useMutation({
    onSuccess: (newComment) => {
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      toast.success("Comment added!");
      onCommentAdded?.();
    },
    onError: (error) => {
      toast.error(`Error adding comment: ${error.message}`);
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be signed in to comment");
      return;
    }
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    createCommentMutation.mutate({
      videoId,
      content: commentText.trim(),
    });
  };

  return (
    <div className="h-full flex flex-col text-white">
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-t-[#FE2C55] border-r-transparent border-b-transparent border-l-transparent rounded-full"
          />
        </div>
      ) : comments.length > 0 ? (
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {comments.map((comment, index) => (
            <motion.div 
              key={comment.id} 
              className="flex gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <div className="flex-shrink-0">
                <Avatar 
                  fallback={(comment.user.username ?? comment.user.name ?? "A").charAt(0).toUpperCase()}
                  size="md"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm text-white/90">
                    {comment.user.username ?? comment.user.name ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-white/40">
                    {formatTimeAgo(new Date(comment.createdAt))}
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed break-words">
                  {comment.content}
                </p>
                
                <div className="flex items-center gap-4 mt-2">
                  <button className="text-xs text-white/50 hover:text-white/80 transition-colors">
                    Reply
                  </button>
                  <button className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors">
                    <Heart className="h-3 w-3" />
                    <span>0</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <MessageCircle className="h-16 w-16 text-white/20 mb-4" />
          <p className="text-center text-white/60 text-base mb-1">No comments yet</p>
          <p className="text-center text-white/40 text-sm">Be the first to comment!</p>
        </div>
      )}

      {/* Comment input - sticky at bottom */}
      <div className="border-t border-white/10 p-4 bg-black/50 backdrop-blur-xl">
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={session ? "Add comment..." : "Sign in to comment"}
            disabled={!session || createCommentMutation.isPending}
            className="flex-1 rounded-full"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!session || !commentText.trim()}
            isLoading={createCommentMutation.isPending}
          >
            Post
          </Button>
        </form>
      </div>
    </div>
  );
}