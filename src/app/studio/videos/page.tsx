"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import { PlaySquare, Edit2, Trash2, Loader2, Save, X, Eye, Heart, MessageSquare } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import toast from "react-hot-toast";
import { formatNumber } from "~/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function StudioVideos() {
  const { data: session } = useSession();

  const { data, isLoading, refetch } = api.studio.getVideoStats.useQuery(
    { limit: 50 },
    { enabled: !!session }
  );

  const editMutation = api.video.editVideo.useMutation({
    onSuccess: () => {
      toast.success("Video updated successfully");
      setEditingId(null);
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.video.deleteVideo.useMutation({
    onSuccess: () => {
      toast.success("Video deleted");
      setDeletingId(null);
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF2D55]" />
      </div>
    );
  }

  const videos = data?.videos ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Content</h1>
          <p className="text-white/60">Manage your uploaded videos</p>
        </div>
        <Link href="/upload">
          <Button variant="primary">Upload New</Button>
        </Link>
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <PlaySquare className="w-16 h-16 text-white/20 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No videos yet</h2>
            <p className="text-white/60 mb-6 max-w-sm">
              Upload your first video to start growing your channel and tracking your analytics.
            </p>
            <Link href="/upload">
              <Button variant="primary">Upload Video</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 text-sm font-medium text-white/50 bg-white/5">
                  <th className="py-4 px-6 font-medium">Video</th>
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Views</th>
                  <th className="py-4 px-6 font-medium">Likes</th>
                  <th className="py-4 px-6 font-medium">Comments</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {videos.map((video) => {
                  const isEditing = editingId === video.id;
                  
                  return (
                    <tr key={video.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-6 leading-tight align-top">
                        <div className="flex gap-4">
                          <Link href={`/video/${video.id}`} className="flex-shrink-0 w-24 h-32 bg-black rounded-lg overflow-hidden relative group-hover:ring-2 ring-white/20 transition-all">
                            {video.thumbnailUrl ? (
                              <Image src={video.thumbnailUrl} alt="" fill className="object-cover" sizes="96px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlaySquare className="w-6 h-6 text-white/20" />
                              </div>
                            )}
                          </Link>
                          
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input 
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  placeholder="Video title"
                                  className="h-8 text-sm bg-white/10 border-white/20"
                                />
                                <Input 
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Video description (optional)"
                                  className="h-8 text-sm bg-white/10 border-white/20"
                                />
                              </div>
                            ) : (
                              <>
                                <h3 className="font-semibold text-base mb-1 line-clamp-2">{video.title}</h3>
                                {video.description && (
                                  <p className="text-white/50 text-xs line-clamp-2 mb-2">{video.description}</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white/60 align-top">
                        {format(new Date(video.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-[#00D4FF]" />
                          <span>{formatNumber(video._count.views)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-[#FF2D55]" />
                          <span>{formatNumber(video._count.likes)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-[#7B2FFF]" />
                          <span>{formatNumber(video._count.comments)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap align-top">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => setEditingId(null)}
                              disabled={editMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              className="h-8 px-3"
                              onClick={() => editMutation.mutate({ videoId: video.id, title: editTitle, description: editDescription })}
                              disabled={editMutation.isPending || !editTitle.trim()}
                            >
                              {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                              Save
                            </Button>
                          </div>
                        ) : deletingId === video.id ? (
                          <div className="flex justify-end gap-2 items-center">
                            <span className="text-xs text-red-400 font-medium">Sure?</span>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => setDeletingId(null)}
                              disabled={deleteMutation.isPending}
                            >
                              No
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              className="h-8 px-2 bg-red-500/20 text-red-500 hover:bg-red-500/30"
                              onClick={() => deleteMutation.mutate({ videoId: video.id })}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes"}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 hover:bg-white/10"
                              onClick={() => {
                                setEditingId(video.id);
                                setEditTitle(video.title ?? "");
                                setEditDescription(video.description ?? "");
                                setDeletingId(null);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-white/50 hover:text-red-400 hover:bg-white/10"
                              onClick={() => setDeletingId(video.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
