import Link from "next/link";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {session ? (
          // Authenticated user view - will show video feed later
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Welcome back, {session.user.name}!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your video feed will appear here once videos are uploaded.
            </p>
            <Link
              href="/upload"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
            >
              Upload Your First Video
            </Link>
          </div>
        ) : (
          // Landing page for non-authenticated users
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Share Your Story
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our community and share short-form videos with the world. 
              Discover amazing content and connect with creators.
            </p>
            <div className="space-x-4">
              <Link
                href="/auth/signup"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700"
              >
                Get Started
              </Link>
              <Link
                href="/auth/signin"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
