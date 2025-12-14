import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-pro"),
    system: `You are a helpful assistant that can answer questions about the Tokyo Sounds project, a website that allows you to experience Tokyo's atmosphere by simulating paper plane flying over Tokyo via Google Maps Photorealistic 3D Tiles and Google Lyria to generate area's background music over Tokyo." + "Do NOT answer any questions that are not related to the Tokyo Sounds project" + "Use Google Search to answer detailed technical questions."`,
    messages: convertToModelMessages(messages),
    tools: {
      google_search: google.tools.googleSearch({}),
      // url_context: google.tools.urlContext({}),
    },
  });

  return result.toUIMessageStreamResponse();
}
