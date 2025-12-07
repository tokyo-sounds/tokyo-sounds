import { NextResponse } from "next/server";
import { getOrCreateCache } from "@/lib/cache-manager";

// Hardcoded repository URL for tokyo-sounds
const TOKYO_SOUNDS_REPO_URL = "https://github.com/tokyo-sounds/tokyo-sounds";

export async function POST(req: Request) {
  try {
    // Optional: allow commitSha override from request body
    const { commitSha }: { commitSha?: string } = await req.json();

    // Get or create cache for tokyo-sounds repository
    const result = await getOrCreateCache(TOKYO_SOUNDS_REPO_URL, commitSha);

    return NextResponse.json({
      cacheName: result.cacheName,
      repoUrl: result.repoUrl,
      commitSha: result.commitSha,
    });
  } catch (error) {
    console.error("Error in cache-repo API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create cache for repository",
      },
      { status: 500 }
    );
  }
}

