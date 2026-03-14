import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "~/server/auth";
import { checkRateLimit } from "~/lib/rate-limit";

const MAX_SIZE = 1024 * 1024 * 25; // 25 MB for DM media
const ALLOWED_TYPES: Record<string, "image" | "video"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
};

/**
 * POST /api/upload-dm-media
 * Upload an image or video to be shared in a DM conversation.
 * Returns { url, mediaType } on success.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Rate limit: 20 DM media uploads per hour per user
      checkRateLimit(`upload-dm:${session.user.id}`, 20, 60 * 60_000);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      return NextResponse.json({ error: errorMsg }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mediaType = ALLOWED_TYPES[file.type];
    if (!mediaType) {
      return NextResponse.json(
        { error: "File type not allowed. Supported: JPEG, PNG, GIF, WebP, MP4, MOV, WebM" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 25 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const fileName = `dm-media/${session.user.id}-${Date.now()}.${ext}`;

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
      }
      const blob = await put(fileName, file, { access: "public", addRandomSuffix: false });
      return NextResponse.json({ url: blob.url, mediaType });
    } else {
      // Local dev — save to public/uploads/dm-media/
      const fsPromises = await import("fs/promises");
      const path = await import("path");
      const fs = await import("fs");

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "dm-media");
      if (!fs.existsSync(uploadsDir)) await fsPromises.mkdir(uploadsDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      await fsPromises.writeFile(path.join(uploadsDir, `${session.user.id}-${Date.now()}.${ext}`), Buffer.from(bytes));

      const url = `/uploads/dm-media/${session.user.id}-${Date.now()}.${ext}`;
      return NextResponse.json({ url, mediaType });
    }
  } catch (err) {
    console.error("DM media upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

export const runtime = "nodejs";
