
"use client";

import { Fragment } from "react";
import { useInView } from "react-intersection-observer";
import { api } from "~/trpc/react";
import VideoPlayer from "./video-player";
import { useEffect } from "react";
import LikeButton from "./like-button";

/**
 * A client-side component that displays an infinite-scrolling feed of videos.
 * It fetches video data using a tRPC infinite query and renders individual video cards.
 */
export default function VideoFeed() {
  const { data, fetchNextPage, hasNextPage, isLoading, isError } = api.video.getFeed.useInfiniteQuery(
    {
      limit: 5,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) {
    return <p className="text-center">Loading videos...</p>;
  }

  if (isError) {
    return <p className="text-center text-red-500">Error loading videos.</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto mt-8">
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.items.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                  {video.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{video.user.name}</p>
                  <p className="text-xs text-gray-500">{new Date(video.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{video.title}</h2>
              {video.description && <p className="text-gray-600 mb-4">{video.description}</p>}
              <div className="aspect-w-9 aspect-h-16">
                <VideoPlayer src={video.filePath} />
              </div>
              <div className="mt-4 flex items-center text-gray-500">
                <LikeButton videoId={video.id} initialLikes={video._count.likes} userHasLiked={video.userHasLiked} />
              </div>
            </div>
          ))}
        </Fragment>
      ))}
      {hasNextPage && (
        <div ref={ref} className="text-center p-4">
          <p>Loading more...</p>
        </div>
      )}
      {!hasNextPage && !isLoading && (
        <div className="text-center p-4">
          <p>You&apos;ve reached the end!</p>
        </div>
      )}
    </div>
  );
}
