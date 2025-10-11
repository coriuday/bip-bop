
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { auth } from "~/server/auth";
import { moderateVideoMetadata } from "~/lib/content-moderation";

const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB (increased)
const ALLOWED_FILE_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
  "video/mpeg",
];

/**
 * A Next.js API route for handling video file uploads.
 * It accepts a POST request with `multipart/form-data`.
 * Validates the file for size and type and saves it to the `public/uploads` directory.
 * Includes content moderation and authentication checks.
 * @param {Request} req - The incoming request object.
 * @returns {NextResponse} - A JSON response indicating success or failure.
 */
export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upload videos." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Content moderation - check filename
    const moderationResult = moderateVideoMetadata({ filename: file.name });
    if (!moderationResult.allowed) {
      return NextResponse.json(
        {
          error: `Content policy violation: ${moderationResult.reason}. Please review our community guidelines.`,
        },
        { status: 403 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() ?? "mp4";
    const fileName = `${session.user.id}-${Date.now()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filePath: `/uploads/${fileName}`,
      fileSize: file.size,
      message: "Video uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error saving file. Please try again." },
      { status: 500 }
    );
  }
}

// Ensure Node.js runtime (not Edge) so that Buffer and fs/promises are available
export const runtime = "nodejs";
