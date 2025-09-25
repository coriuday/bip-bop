
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

/**
 * A client-side, responsive navigation bar component.
 * It displays different navigation links based on the user's authentication status.
 */
export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              VidShare
            </Link>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-4">
              {status === "authenticated" ? (
                <>
                  <Link href="/upload" className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                    Upload
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">{session.user.name}</span>
                  </div>
                </>
              ) : status === "unauthenticated" ? (
                <>
                  <Link href="/auth/signin" className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                    Sign Up
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
