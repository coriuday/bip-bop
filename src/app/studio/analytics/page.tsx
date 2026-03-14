"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Users,
  Video,
  Loader2,
  Calendar,
} from "lucide-react";
import { formatNumber } from "~/lib/utils";
import Link from "next/link";

type Period = 7 | 28;

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<Period>(7);

  const { data: overview, isLoading: overviewLoading } =
    api.studio.getOverview.useQuery();

  const { data: channelTrend, isLoading: trendLoading } =
    api.studio.getChannelTrend.useQuery({ days: period });

  const { data: videoStats } = api.studio.getVideoStats.useQuery({
    limit: 5,
  });

  if (!session) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-white/60">
        <TrendingUp className="h-12 w-12" />
        <p>Sign in to view your analytics.</p>
        <Link
          href="/auth/signin"
          className="rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 px-6 py-2 text-sm font-semibold text-white"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const periodLabel = period === 7 ? "7 days" : "28 days";

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-white/60">Track your channel performance</p>
        </div>
        {/* Period Selector */}
        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
          {([7, 28] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                period === p
                  ? "bg-gradient-to-r from-pink-500 to-cyan-400 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      {overviewLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            icon={Eye}
            label="Total Views"
            value={overview?.totalViews ?? 0}
            color="text-cyan-400"
            gradient="from-cyan-500/20 to-cyan-500/5"
          />
          <StatCard
            icon={Heart}
            label="Total Likes"
            value={overview?.totalLikes ?? 0}
            color="text-pink-400"
            gradient="from-pink-500/20 to-pink-500/5"
          />
          <StatCard
            icon={MessageCircle}
            label="Comments"
            value={overview?.totalComments ?? 0}
            color="text-purple-400"
            gradient="from-purple-500/20 to-purple-500/5"
          />
          <StatCard
            icon={Users}
            label="Followers"
            value={overview?.totalFollowers ?? 0}
            color="text-green-400"
            gradient="from-green-500/20 to-green-500/5"
          />
          <StatCard
            icon={Video}
            label="Videos"
            value={overview?.videoCount ?? 0}
            color="text-yellow-400"
            gradient="from-yellow-500/20 to-yellow-500/5"
          />
        </div>
      )}

      {/* View Trend Chart */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">
            Views — Last {periodLabel}
          </h2>
        </div>

        {trendLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={channelTrend ?? []}>
              <defs>
                <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                tickFormatter={(v: string) => v.slice(5)} // MM-DD
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#viewGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Videos Performance */}
      {videoStats && videoStats.videos.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">
            Top Videos by Likes
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[...videoStats.videos]
                .sort((a, b) => b._count.likes - a._count.likes)
                .slice(0, 5)
                .map((v) => ({
                  name:
                    (v.title ?? "Untitled").length > 16
                      ? (v.title ?? "Untitled").slice(0, 16) + "…"
                      : (v.title ?? "Untitled"),
                  likes: v._count.likes,
                  views: v._count.views,
                  comments: v._count.comments,
                }))}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#fff",
                }}
              />
              <Bar dataKey="likes" radius={[6, 6, 0, 0]}>
                {videoStats.videos.slice(0, 5).map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={
                      ["#f43f5e", "#ec4899", "#a855f7", "#22d3ee", "#10b981"][
                        i % 5
                      ]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Detailed table */}
          <div className="mt-6 space-y-3">
            {videoStats.videos.map((video, i) => (
              <div
                key={video.id}
                className="flex items-center gap-4 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
              >
                <span className="w-5 text-center text-sm font-bold text-white/30">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {video.title ?? "Untitled"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-cyan-400" />
                    {formatNumber(video._count.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-pink-400" />
                    {formatNumber(video._count.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-purple-400" />
                    {formatNumber(video._count.comments)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  gradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-5`}
    >
      <div className={`mb-3 inline-flex rounded-xl bg-white/10 p-2 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-white">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-white/50">{label}</p>
    </div>
  );
}
