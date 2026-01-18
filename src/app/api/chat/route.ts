import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";

// Base system prompt for Tokyo Sounds assistant
const BASE_SYSTEM_PROMPT = `You are a helpful assistant for the Tokyo Sounds project - a website that lets users experience Tokyo's atmosphere by simulating paper plane flight over Tokyo using Google Maps Photorealistic 3D Tiles and Google Lyria for AI-generated area-specific background music.

Key features of Tokyo Sounds:
- Paper plane flight simulation over real 3D Tokyo
- Google Maps Photorealistic 3D Tiles for realistic city rendering
- Google Lyria AI-generated music that changes based on the district you're flying over
- Spatial audio with procedural city sounds
- Multiplayer support to fly with friends
- Districts include: Shibuya, Shinjuku, Akihabara, Ikebukuro, Asakusa, Tokyo Tower, and more

You should:
- Answer questions about the Tokyo Sounds project, its features, and how to use it
- Help users understand the technology stack (React, Next.js, Three.js, Google APIs)
- Provide guidance on flight controls and navigation
- Be friendly and concise
- Respond in the same language the user uses (Japanese, English, Chinese)

Do NOT answer questions unrelated to Tokyo Sounds. Politely redirect users to ask about the project.
Use Google Search when you need detailed technical information.

The project's repository is https://github.com/tokyo-sounds/tokyo-sounds`;

export async function POST(req: Request) {
  const { messages, pageContext }: { messages: UIMessage[]; pageContext?: string } = await req.json();

  // Build system prompt with optional page context
  let systemPrompt = BASE_SYSTEM_PROMPT;
  
  if (pageContext) {
    systemPrompt += `\n\nCurrent page context: ${pageContext}
When answering, you can reference what the user is currently viewing on this page to provide more relevant help.`;
  }

  const result = streamText({
    model: google("gemini-2.5-pro"),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      google_search: google.tools.googleSearch({}),
    },
  });

  return result.toUIMessageStreamResponse();
}
