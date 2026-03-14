"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Eye, Heart, MessageSquare, Users, TrendingUp, PlaySquare } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { formatNumber } from "~/lib/utils";
import Image from "next/image";

export default function StudioDashboard() {
  const { data: session } = useSession();

  const { data: overview, isLoading: overviewLoading } =
    api.studio.getOverview.useQuery(undefined, { enabled: !!session });

  const { data: channelTrend, isLoading: trendLoading } =
    api.studio.getChannelTrend.useQuery({ days: 7 }, { enabled: !!session });

  const { data: recentVideosData, isLoading: recentLoading } =
    api.studio.getVideoStats.useQuery({ limit: 5 }, { enabled: !!session });

  const isLoading = overviewLoading || trendLoading || recentLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF2D55] border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  // Format trend data for chart
  const chartData = channelTrend?.map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    views: d.count,
  })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-2">
          Channel Analytics
        </h1>
        <p className="text-white/60">Overview of your performance</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Views",
            value: overview?.totalViews ?? 0,
            icon: Eye,
            color: "text-[#00D4FF]",
            bg: "bg-[#00D4FF]/10",
          },
          {
            label: "Total Likes",
            value: overview?.totalLikes ?? 0,
            icon: Heart,
            color: "text-[#FF2D55]",
            bg: "bg-[#FF2D55]/10",
          },
          {
            label: "Comments",
            value: overview?.totalComments ?? 0,
            icon: MessageSquare,
            color: "text-[#7B2FFF]",
            bg: "bg-[#7B2FFF]/10",
          },
          {
            label: "Followers",
            value: overview?.totalFollowers ?? 0,
            icon: Users,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <h3 className="text-sm font-medium text-white/60">{stat.label}</h3>
            </div>
            <p className="text-3xl font-bold">{formatNumber(stat.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF2D55]" />
              Views (Last 7 Days)
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val: number) => formatNumber(val)} 
                  dx={-10} 
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#FF2D55"
                  strokeWidth={3}
                  dot={{ fill: "#FF2D55", strokeWidth: 2, r: 4, stroke: "#0a0a0a" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Videos */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PlaySquare className="w-5 h-5 text-[#00D4FF]" />
              Recent Video Performance
            </h2>
          </div>

          <div className="flex-1 space-y-4">
            {recentVideosData?.videos.length === 0 ? (
              <div className="text-center text-white/50 py-8">
                No videos uploaded yet.
              </div>
            ) : (
              recentVideosData?.videos.map((vid) => (
                <Link 
                  key={vid.id} 
                  href={`/studio/videos`}
                  className="flex gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className="w-20 h-28 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0 relative">
                    {vid.thumbnailUrl ? (
                      <Image src={vid.thumbnailUrl} alt={vid.title ?? "Video"} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <PlaySquare className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="font-medium truncate group-hover:text-[#00D4FF] transition-colors mb-1">
                      {vid.title ?? "Untitled Video"}
                    </p>
                    <div className="text-xs text-white/50 space-y-1">
                      <p>{formatNumber(vid._count.views)} views</p>
                      <p>{formatNumber(vid._count.likes)} likes</p>
                      <p>{formatNumber(vid._count.comments)} comments</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          
          <Link href="/studio/videos" className="w-full mt-4 py-3 text-center text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors border border-white/10">
            View All Content
          </Link>
        </div>
      </div>
    </div>
  );
}
