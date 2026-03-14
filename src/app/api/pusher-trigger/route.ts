import { NextResponse } from "next/server";
import { pusherServer } from "~/lib/pusher";
import { auth } from "~/server/auth";

/**
 * Generic Pusher event trigger endpoint for client-side events
 * (e.g., live stream comments, hearts, join/leave events).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { channel?: string; event?: string; data?: unknown };
  const { channel, event, data } = body;

  if (!channel || !event) {
    return NextResponse.json({ error: "channel and event are required" }, { status: 400 });
  }

  // Only allow live-* channels from this endpoint to prevent abuse
  if (!channel.startsWith("live-")) {
    return NextResponse.json({ error: "Only live channels allowed" }, { status: 403 });
  }

  await pusherServer.trigger(channel, event, data ?? {});
  return NextResponse.json({ success: true });
}
