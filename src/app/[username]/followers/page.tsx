"use client";

import { useState, use } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default function FollowersPage({ params }: Props) {
  const { username } = use(params);
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");

  const { data: user } = api.user.getByUsername.useQuery({ username });
  const { data: followers } = api.user.getFollowers.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id && activeTab === "followers" }
  );
  const { data: following } = api.user.getFollowing.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id && activeTab === "following" }
  );

  const isOwnProfile = session?.user?.id === user?.id;

  const tabs = [
    { id: "followers", label: "Followers", count: user?._count?.followers ?? 0 },
    { id: "following", label: "Following", count: user?._count?.following ?? 0 },
  ];

  const displayUsers = activeTab === "followers" ? followers : following;

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20 text-white md:pb-0">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${username}`}
            className="mb-4 inline-block text-sm text-gray-400 hover:text-white"
          >
            ← Back to profile
          </Link>
          <h1 className="mb-2 text-3xl font-bold">
            {user?.name ?? user?.username ?? "User"}
          </h1>
          <p className="text-gray-400">@{user?.username ?? "username"}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`relative flex items-center gap-2 px-6 py-3 transition-colors ${
                    isActive ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <span className="font-medium">{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {tab.count}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="activeFollowTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-cyan-400"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Users List */}
        {!displayUsers || displayUsers.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              No {activeTab === "followers" ? "followers" : "following"} yet
            </h3>
            <p className="text-gray-400">
              {activeTab === "followers"
                ? isOwnProfile
                  ? "When people follow you, they will appear here"
                  : "This user has no followers yet"
                : isOwnProfile
                  ? "Start following people to see them here"
                  : "This user is not following anyone yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20"
              >
                <div className="flex items-center gap-4">
                  <Link href={`/${user.username ?? user.name}`}>
                    <Avatar
                      src={user.image ?? undefined}
                      fallback={
                        user.username?.charAt(0).toUpperCase() ??
                        user.name?.charAt(0).toUpperCase() ??
                        "U"
                      }
                      size="lg"
                      className="ring-2 ring-white/10"
                    />
                  </Link>

                  <div className="flex-1">
                    <Link href={`/${user.username ?? user.name}`}>
                      <h3 className="font-semibold hover:underline">
                        {user.name ?? user.username}
                      </h3>
                      <p className="text-sm text-gray-400">@{user.username ?? "username"}</p>
                    </Link>
                    {user.bio && (
                      <p className="mt-1 text-sm text-gray-300 line-clamp-2">{user.bio}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>{user._count.followers} followers</span>
                      <span>{user._count.videos} videos</span>
                    </div>
                  </div>

                  {session?.user?.id !== user.id && (
                    <Button variant="primary" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
