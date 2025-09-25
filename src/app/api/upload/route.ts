
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

const MAX_FILE_SIZE = 1024 * 1024 * 50; // 50MB
const ALLOWED_FILE_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"];

/**
 * A Next.js API route for handling video file uploads.
 * It accepts a POST request with `multipart/form-data`.
 * Validates the file for size and type and saves it to the `public/uploads` directory.
 * @param {Request} req - The incoming request object.
 * @returns {NextResponse} - A JSON response indicating success or failure.
 */
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File size exceeds 50MB" }, { status: 400 });
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileExtension = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExtension}`;
  const filePath = join(process.cwd(), "public", "uploads", fileName);

  try {
    await writeFile(filePath, buffer);
    return NextResponse.json({ success: true, filePath: `/uploads/${fileName}`, fileSize: file.size });
  } catch {
    return NextResponse.json({ error: "Error saving file" }, { status: 500 });
  }
}
