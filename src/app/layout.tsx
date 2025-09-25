import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthSessionProvider } from "~/components/providers/session-provider";
import { Navbar } from "~/components/layout/navbar";

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
            <Navbar />
            <main>{children}</main>
          </AuthSessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
