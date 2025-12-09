import { UIMessage } from "ai";
import {
  Message,
  MessageAction,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { MessageSquareIcon } from "lucide-react";

export default function MessagesContainer({
  messages,
}: {
  messages: UIMessage[];
}) {
  return (
    <Conversation className="size-full min-h-0">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            description="Messages will appear here as the conversation progresses."
            icon={<MessageSquareIcon className="size-6" />}
            title="Start a conversation"
          />
        ) : (
          messages.map((message: UIMessage) => (
            <Message from={message.role} key={message.id}>
              {message.parts.map((part, index) =>
                part.type === "text" ? (
                  message.role === "user" ? (
                    <MessageContent key={index}>{part.text}</MessageContent>
                  ) : (
                    <MessageResponse key={index}>{part.text}</MessageResponse>
                  )
                ) : null
              )}
            </Message>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
