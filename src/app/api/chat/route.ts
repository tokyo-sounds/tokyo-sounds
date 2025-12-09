import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { ProjectBriefTool } from "@/lib/ai-tools";

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
  const {
    messages,
    sources,
    providerMetadata,
  }: { messages: UIMessage[]; sources: string[]; providerMetadata: any } =
    await req.json();

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
    system: `You are a helpful assistant that can answer questions about the Tokyo Sounds project." + "use ProjectBriefTool to get the brief of Tokyo Sounds" + "Do NOT answer any questions that are not related to the Tokyo Sounds project" + "use URL Context Tool to get the latest code information from the GitHub repository" + "use Google Search Tool to search the web for technical information about the API and libraries used in Tokyo Sounds"`,
    messages: convertToModelMessages(messages),
    tools: {
      project_brief: ProjectBriefTool,
      url_context: google.tools.urlContext({}),
      google_search: google.tools.googleSearch({}),
    },
  });

  // const metadata = providerMetadata?.google as
  //   | GoogleGenerativeAIProviderMetadata
  //   | undefined;
  // const groundingMetadata = metadata?.groundingMetadata;
  // const urlContextMetadata = metadata?.urlContextMetadata;

  return result.toUIMessageStreamResponse();
}
