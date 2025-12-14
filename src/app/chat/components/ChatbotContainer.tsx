"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import MessageContainer from "./MessageContainer";
import InputContainer from "./InputContainer";
import { PromptInputMessage } from "@/components/ai-elements/prompt-input";

export default function ChatbotContainer() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage({ text: message.text, files: [] });
    setInput("");
  };

  return (
    <>
      <MessageContainer messages={messages} />
      <InputContainer handleSubmit={handleSubmit} status={status} />
    </>
  );
}
