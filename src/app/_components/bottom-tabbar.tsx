"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, PlusSquare, Bell, MessageCircle, User } from "lucide-react";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/upload", label: "Upload", icon: PlusSquare },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/messages", label: "Inbox", icon: MessageCircle },
    { href: session?.user?.name ? `/${session.user.name}` : "/auth/signin", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-white/10">
      <div className="mx-auto w-full max-w-7xl">
        <ul className="flex items-center justify-around py-3 px-4">
          {tabs.map((t) => {
            const active = pathname === t.href;
            const Icon = t.icon;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                    active ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${active ? "fill-white" : ""}`} />
                  <span className="text-[10px] font-medium">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}


