import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const galleryDir = join(process.cwd(), "public", "images", "gallery");
    const files = await readdir(galleryDir);

    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const imagePaths = files
      .filter((file) =>
        imageExtensions.some((ext) => file.toLowerCase().endsWith(ext))
      )
      .map((file) => `/images/gallery/${file}`)
      .sort();

    return NextResponse.json({ files: imagePaths });
  } catch (error) {
    console.error("[API] Error reading gallery images:", error);
    return NextResponse.json({ files: [] });
  }
}
