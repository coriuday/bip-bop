import "~/styles/globals.css";

import { type Metadata } from "next";
import { Toaster } from "react-hot-toast";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthSessionProvider } from "~/components/providers/session-provider";
import { ThemeProvider } from "~/components/providers/theme-provider";
import Navbar from "~/components/layout/navbar";
import ErrorBoundary from "./error-boundary";
import AuroraBackground from "./_components/aurora-background";
import BottomTabBar from "./_components/bottom-tabbar";

export const metadata: Metadata = {
  title: "bip bop",
  description: "bip bop - A short-form video sharing platform",
  icons: [
    { rel: "icon", url: "/bipbop-logo.svg" },
    { rel: "icon", url: "/favicon.ico" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans bg-black text-white">
        <ThemeProvider>
          <AuroraBackground>
            <TRPCReactProvider>
              <AuthSessionProvider>
                <ErrorBoundary>
                  <Navbar />
                  <main className="relative pt-16 pb-20">{children}</main>
                  <BottomTabBar />
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      style: {
                        background: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
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
