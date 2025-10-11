
"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface LikeButtonProps {
  videoId: number;
  initialLikes: number;
  userHasLiked: boolean;
}

/**
 * A client-side component that renders a like button for a video.
 * It displays the current like count and allows authenticated users to toggle their like status.
 * It uses optimistic updates for immediate UI feedback.
 * @param {LikeButtonProps} props - The props for the component.
 * @param {number} props.videoId - The ID of the video.
 * @param {number} props.initialLikes - The initial number of likes for the video.
 * @param {boolean} props.userHasLiked - Whether the current user has liked the video.
 */
export default function LikeButton({ videoId, initialLikes, userHasLiked }: LikeButtonProps) {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(userHasLiked);

  const utils = api.useUtils();

  const toggleLikeMutation = api.video.toggleLike.useMutation({
    onMutate: async ({ videoId }) => {
      await utils.video.getFeed.cancel();
      
      const previousFeed = utils.video.getFeed.getInfiniteData();

      utils.video.getFeed.setInfiniteData({}, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            items: page.items.map(item => {
              if (item.id === videoId) {
                return {
                  ...item,
                  _count: {
                    ...item._count,
                    likes: item._count.likes + (liked ? -1 : 1),
                  },
                  userHasLiked: !liked,
                };
              }
              return item;
            }),
          })),
        };
      });

      setLiked(!liked);
      setLikes(likes + (liked ? -1 : 1));

      return { previousFeed };
    },
    onError: (err, newTodo, context) => {
      utils.video.getFeed.setInfiniteData({}, context?.previousFeed);
      setLiked(userHasLiked);
      setLikes(initialLikes);
      toast.error("Failed to update like. Please try again.");
    },
    onSettled: () => {
      void utils.video.getFeed.invalidate();
    },
  });

  const handleLike = () => {
    if (!session) {
      toast.error("You must be logged in to like a video.");
      return;
    }
    void toggleLikeMutation.mutate({ videoId });
  };

  return (
    <button
      onClick={handleLike}
      disabled={toggleLikeMutation.isPending}
      className={`flex items-center space-x-2 text-gray-500 hover:text-red-500 disabled:opacity-50 transition-colors duration-200 ${liked ? "text-red-500" : ""}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill={liked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
        />
      </svg>
      <span>{likes}</span>
    </button>
  );
}
