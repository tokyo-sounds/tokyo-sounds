"use client";

import { useRef } from "react";
import { ChatStatus } from "ai";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon } from "lucide-react";

export default function InputContainer({
  handleSubmit,
  status,
}: {
  handleSubmit: (message: PromptInputMessage) => void;
  status: ChatStatus;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <PromptInputProvider>
      <PromptInput globalDrop multiple onSubmit={handleSubmit}>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputBody>
          <PromptInputTextarea ref={textareaRef} />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputSubmit status={status} className="rounded-full size-10" />
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  );
}
