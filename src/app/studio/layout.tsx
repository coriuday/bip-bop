import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Video, BarChart2 } from "lucide-react";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Creator Studio | BipBop",
  description: "Manage your videos and track your analytics.",
};

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Studio Sidebar */}
      <aside className="w-64 border-r border-white/10 hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF2D55] to-[#00D4FF] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,45,85,0.4)]">
              Studio
            </h1>
          </Link>
        </div>
        
        <nav className="p-4 flex-1 space-y-1">
          <Link 
            href="/studio"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 text-[#FF2D55]" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link 
            href="/studio/videos"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Video className="w-5 h-5 text-[#00D4FF]" />
            <span className="font-medium">Content</span>
          </Link>
          <Link 
            href="/studio/analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
          >
            <BarChart2 className="w-5 h-5 text-[#7B2FFF]" />
            <span className="font-medium">Analytics</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-20 md:pb-0 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto w-full p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav (Studio version) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/10 flex items-center justify-around z-50 pb-safe">
        <Link href="/studio" className="flex flex-col items-center justify-center w-full h-full text-white/60 hover:text-white transition-colors">
          <LayoutDashboard className="w-6 h-6 mb-1 text-[#FF2D55]" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>
        <Link href="/studio/videos" className="flex flex-col items-center justify-center w-full h-full text-white/60 hover:text-white transition-colors">
          <Video className="w-6 h-6 mb-1 text-[#00D4FF]" />
          <span className="text-[10px] font-medium">Content</span>
        </Link>
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-white/60 hover:text-white transition-colors">
          <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            Exit
          </span>
        </Link>
      </div>
    </div>
  );
}
