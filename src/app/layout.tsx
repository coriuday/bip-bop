import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthSessionProvider } from "~/components/providers/session-provider";
import Navbar from "~/components/layout/navbar";
import ErrorBoundary from "./error-boundary";

export const metadata: Metadata = {
  title: "Video Platform",
  description: "A short-form video sharing platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <AuthSessionProvider>
            <ErrorBoundary>
              <Navbar />
              <main>{children}</main>
              <Toaster position="bottom-right" />
            </ErrorBoundary>
          </AuthSessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
