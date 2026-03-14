"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, PlusSquare, Bell, MessageCircle, User, Radio } from "lucide-react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Fetch unread notification count for badge
  const { data: notifData } = api.notification.getUnreadCount.useQuery(undefined, {
    enabled: !!session,
    refetchInterval: 30000,
  });
  const unreadCount = typeof notifData === "number" ? notifData : 0;

  const profileHref = session?.user?.username
    ? `/${session.user.username}`
    : session?.user?.name
      ? `/${session.user.name}`
      : "/auth/signin";

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/upload", label: "Upload", icon: PlusSquare, isUpload: true },
    {
      href: "/notifications",
      label: "Inbox",
      icon: Bell,
      badge: unreadCount > 0 ? Math.min(unreadCount, 99) : 0,
    },
    { href: "/messages", label: "Messages", icon: MessageCircle },
    { href: "/live", label: "LIVE", icon: Radio },
    { href: profileHref, label: "Profile", icon: User, isProfile: true },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-4 left-1/2 z-40 flex w-[96%] max-w-[26rem] -translate-x-1/2 items-center justify-between rounded-2xl border border-white/10 bg-[#0D0D0D]/90 px-1 py-1.5 shadow-[0_8px_40px_0_rgba(0,0,0,0.7)] backdrop-blur-2xl md:hidden"
    >
      {tabs.map((tab) => {
        const isUpload = !!tab.isUpload;
        const Icon = tab.icon;

        // Active check — profile tab matches any /username path that isn't a main route
        const isActive = isUpload
          ? false
          : tab.isProfile
            ? pathname !== "/" &&
              pathname !== "/search" &&
              pathname !== "/notifications" &&
              pathname !== "/messages" &&
              pathname !== "/upload" &&
              !pathname.startsWith("/studio") &&
              !pathname.startsWith("/auth")
            : pathname === tab.href;

        if (isUpload) {
          return (
            <div key={tab.href} className="relative -mt-6 flex items-center justify-center">
              {/* Glow behind upload */}
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#FF2D55] to-[#7B2FFF] blur-md opacity-70 animate-pulse-glow"
              />
              <Link
                href={tab.href}
                aria-label="Upload a video"
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF2D55] to-[#7B2FFF] shadow-xl border border-white/20 active:scale-95 transition-transform"
              >
                <Icon className="h-7 w-7 text-white" strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all duration-200",
              isActive ? "text-white" : "text-white/40 hover:text-white/70",
            )}
          >
            {/* Icon */}
            <div className="relative">
              <Icon
                className={cn(
                  "h-6 w-6 transition-all",
                  isActive && "drop-shadow-[0_0_8px_rgba(255,45,85,0.7)]",
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
                aria-hidden="true"
              />
              {/* Notification badge */}
              {tab.badge && tab.badge > 0 ? (
                <span
                  aria-label={`${tab.badge} unread notifications`}
                  className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF2D55] px-1 text-[10px] font-bold text-white"
                >
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              ) : null}
            </div>

            {/* Label — always shown */}
            <span
              className={cn(
                "text-[10px] font-medium leading-none transition-all",
                isActive ? "text-white" : "text-white/40",
              )}
            >
              {tab.label}
            </span>

            {/* Active dot indicator */}
            {isActive && (
              <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF2D55] to-[#00D4FF]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
