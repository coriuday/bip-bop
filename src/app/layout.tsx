import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Toaster } from "react-hot-toast";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthSessionProvider } from "~/components/providers/session-provider";
import { ThemeProvider } from "~/components/providers/theme-provider";
import Navbar from "~/components/layout/navbar";
import ErrorBoundary from "./error-boundary";
import AuroraBackground from "./_components/aurora-background";
import BottomTabBar from "./_components/bottom-tabbar";

export const metadata: Metadata = {
  title: {
    default: "BipBop – Create. Connect. Go Viral.",
    template: "%s | BipBop",
  },
  description:
    "BipBop is a short-form video platform where creators share moments, go viral, and build communities. Swipe, like, comment and discover.",
  keywords: ["short videos", "creators", "viral", "social media", "bipbop"],
  authors: [{ name: "BipBop Team" }],
  openGraph: {
    type: "website",
    siteName: "BipBop",
    title: "BipBop – Create. Connect. Go Viral.",
    description:
      "Short-form video platform for creators. Swipe, like, share and discover.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "BipBop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BipBop – Create. Connect. Go Viral.",
    description: "Short-form video platform for creators.",
    images: ["/og-image.png"],
  },
  icons: [
    { rel: "icon", url: "/bipbop-logo.svg" },
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/bipbop-logo.svg" },
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BipBop",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF2D55",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <ThemeProvider>
          <AuroraBackground>
            <TRPCReactProvider>
              <AuthSessionProvider>
                <ErrorBoundary>
                  {/* Skip-to-content link for screen readers */}
                  <a href="#main-content" className="skip-link">
                    Skip to content
                  </a>
                  <Navbar />
                  <main
                    id="main-content"
                    className="relative pt-16 pb-24 md:pb-0"
                  >
                    {children}
                  </main>
                  <BottomTabBar />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      style: {
                        background: "#1a1a1a",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "14px",
                      },
                      success: {
                        iconTheme: { primary: "#00D4FF", secondary: "#0a0a0a" },
                      },
                      error: {
                        iconTheme: { primary: "#FF2D55", secondary: "#0a0a0a" },
                      },
                    }}
                  />
                </ErrorBoundary>
              </AuthSessionProvider>
            </TRPCReactProvider>
          </AuroraBackground>
        </ThemeProvider>
      </body>
    </html>
  );
}
