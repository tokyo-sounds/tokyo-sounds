import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google, GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";

// TODO: vvv Cache Example vvv
// const filePath = path.join(process.cwd(), "src", "TECHNICAL_SUMMARY_JA.md");
// const document = await ai.files.upload({
//   file: filePath,
//   // config: { mimeType: "text/plain" },
// });
// console.log("Uploaded file name:", document.name);
// const modelName = "gemini-1.5-flash-001";

// const contents = [
//   createUserContent(createPartFromUri(document.uri, document.mimeType)),
// ];

// const cache = await ai.caches.create({
//   model: modelName,
//   config: {
//     contents: contents,
//     systemInstruction: "You are an expert analyzing transcripts.",
//   },
// });
// console.log("Cache created:", cache);

// const response = await ai.models.generateContent({
//   model: modelName,
//   contents: "Please summarize this transcript",
//   config: { cachedContent: cache.name },
// });
// console.log("Response text:", response.text);
// TODO: ^^^ Cache Example ^^^

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // TODO: vvv Use FileSearchStore to create a RAG chatbot vvv
  //  const sampleFile = await ai.files.upload({
  //    file: "sample.txt",
  //    config: { name: "file-name" },
  //  });

  //  const fileSearchStore = await ai.fileSearchStores.create({
  //    config: { displayName: "tokyo-sounds-file-search-store" },
  //  });

  //  let operation = await ai.fileSearchStores.importFile({
  //    fileSearchStoreName: fileSearchStore.name!,
  //    fileName: sampleFile.name!,
  //  });

  //  while (!operation.done) {
  //    await new Promise((resolve) => setTimeout(resolve, 5000));
  //    operation = await ai.operations.get({ operation: operation });
  //  }
  // TODO: ^^^ Use FileSearchStore to create a RAG chatbot ^^^

  const result = streamText({
    model: google("gemini-2.5-pro"),
    system: `You are a helpful assistant that can answer questions about the Tokyo Sounds project, a website that allows you to experience Tokyo's atmosphere by simulating paper plane flying over Tokyo via Google Maps Photorealistic 3D Tiles and Google Lyria to generate area's background music over Tokyo." + "Do NOT answer any questions that are not related to the Tokyo Sounds project" + "Based on this context: https://github.com/tokyo-sounds/tokyo-sounds/blob/master/README.md, answer user's questions."`,
    messages: convertToModelMessages(messages),
    tools: {
      google_search: google.tools.googleSearch({}),
      url_context: google.tools.urlContext({}),
    },
  });

  return result.toUIMessageStreamResponse();
}
