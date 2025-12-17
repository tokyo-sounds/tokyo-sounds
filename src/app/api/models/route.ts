import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

/**
 * API route to get list of 3D model files in /models/
 */
export async function GET() {
  try {
    const modelsDir = join(process.cwd(), "public", "models");
    const files = await readdir(modelsDir);

    // Filter for 3D model file extensions
    const modelExtensions = [".glb", ".gltf"];
    const modelFiles = files
      .filter((file) =>
        modelExtensions.some((ext) => file.toLowerCase().endsWith(ext))
      )
      .map((file) => ({
        name: file,
        path: `/models/${file}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ models: modelFiles });
  } catch (error) {
    console.error("[API] Error reading model files:", error);
    // Return empty array if directory doesn't exist or can't be read
    return NextResponse.json({ models: [] });
  }
}

