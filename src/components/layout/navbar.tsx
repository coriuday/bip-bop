"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Compass, MessageSquare, BarChart2, Bell, Upload } from "lucide-react";
import { cn } from "~/lib/utils";

export default function Navbar() {
  const { status, data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "For You", href: "/" },
    { icon: Compass, label: "Discover", href: "/search" },
    { icon: MessageSquare, label: "Messages", href: "/messages" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    ...(session ? [{ icon: BarChart2, label: "Studio", href: "/studio" }] : []),
  ];

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-black/85 backdrop-blur-2xl">
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3" aria-label="BipBop Home">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#FF2D55] to-[#00D4FF] opacity-25 blur transition duration-200 group-hover:opacity-60" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF2D55] to-[#7B2FFF]">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 3h4a4 4 0 014 4 4 4 0 01-1.5 3.1A4 4 0 0115 14a4 4 0 01-4 4H7V3zm4 7a2 2 0 100-4H9v4h2zm0 6a2 2 0 100-4H9v4h2z" />
                  <circle cx="18" cy="18" r="3" opacity="0.8" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight">
              bip<span className="gradient-text">bop</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href} className="group relative">
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-[#A0A0A0] hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </motion.div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute right-2 -bottom-[17px] left-2 h-0.5 rounded-full bg-gradient-to-r from-[#FF2D55] to-[#00D4FF]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Upload Button — always visible */}
            <Link href="/upload">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                aria-label="Upload a video"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2D55] to-[#7B2FFF] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#FF2D55]/25 transition-shadow hover:shadow-[#FF2D55]/50"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </motion.button>
            </Link>

            {/* Auth area */}
            {status === "authenticated" ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hidden px-3 py-2 text-sm text-[#A0A0A0] transition-colors hover:text-white lg:block rounded-lg hover:bg-white/5"
                >
                  Sign out
                </button>
                <Link
                  href={`/${session.user?.username ?? session.user?.name ?? "profile"}`}
                  aria-label="Your profile"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF2D55] to-[#7B2FFF] p-0.5"
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0D0D0D] text-sm font-bold">
                      {session.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                  </motion.div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-[#A0A0A0] transition-colors hover:text-white rounded-xl hover:bg-white/5"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
