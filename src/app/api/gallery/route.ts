import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const galleryDir = join(process.cwd(), "public", "images", "gallery");
    const files = await readdir(galleryDir);

    const mediaExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".mov", ".mp4", ".webm"];
    const mediaPaths = files
      .filter((file) =>
        mediaExtensions.some((ext) => file.toLowerCase().endsWith(ext))
      )
      .map((file) => `/images/gallery/${file}`)
      .sort();

    return NextResponse.json({ files: mediaPaths });
  } catch (error) {
    console.error("[API] Error reading gallery images:", error);
    return NextResponse.json({ files: [] });
  }
}
