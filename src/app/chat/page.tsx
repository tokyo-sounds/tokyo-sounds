"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import CommonPageContainer from "@/components/layout/CommonPageContainer";
import MessageContainer from "./components/MessageContainer";
import { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import InputContainer from "./components/InputContainer";
import { ConversationScrollButton } from "@/components/ai-elements/conversation";

export default function Page() {
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
    <CommonPageContainer>
      <MessageContainer messages={messages} />
      <InputContainer handleSubmit={handleSubmit} status={status} />
    </CommonPageContainer>
  );
}
