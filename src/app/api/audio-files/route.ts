import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

/**
 * API route to get list of audio files in /audio/ambient-sounds/
 */
export async function GET() {
  try {
    const audioDir = join(process.cwd(), "public", "audio", "ambient-sounds");
    const files = await readdir(audioDir);

    // Filter for audio file extensions
    const audioExtensions = [".mp3", ".m4a", ".wav", ".ogg", ".aac"];
    const audioFiles = files
      .filter((file) =>
        audioExtensions.some((ext) => file.toLowerCase().endsWith(ext))
      )
      .map((file) => `/audio/ambient-sounds/${file}`)
      .sort();

    return NextResponse.json({ files: audioFiles });
  } catch (error) {
    console.error("[API] Error reading audio files:", error);
    // Return empty array if directory doesn't exist or can't be read
    return NextResponse.json({ files: [] });
  }
}
