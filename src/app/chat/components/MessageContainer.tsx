import { UIMessage } from "ai";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { MessageSquareIcon } from "lucide-react";

export default function MessagesContainer({
  messages,
}: {
  messages: UIMessage[];
}) {
  return (
    <Conversation className="size-full h-full min-h-0">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            icon={<MessageSquareIcon className="size-12" />}
            title="Start a conversation"
            description="Type your questions below to start the conversation."
          />
        ) : (
          messages.map((message: UIMessage) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "text":
                      return part.state === "streaming" ? (
                        <Shimmer key={index}>{part.text}</Shimmer>
                      ) : (
                        <MessageResponse key={index}>{part.text}</MessageResponse>
                      );
                    default:
                      return null;
                  }
                })}
              </MessageContent>
            </Message>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
