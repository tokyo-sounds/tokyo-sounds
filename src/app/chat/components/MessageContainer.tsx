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
import { chatbot } from "@/lib/constraint";

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
            icon={<MessageSquareIcon className="size-12 text-primary" />}
            title={chatbot.initial.title}
            subtitle={chatbot.initial.subtitle}
            description={chatbot.initial.description}
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between">
              <h1 className="text-2xl font-bold tracking-wider uppercase">
                Tokyo Sounds
              </h1>
              <h3 className="text-lg font-thin">音で巡る東京</h3>
            </div>
            {messages.map((message: UIMessage) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) => {
                    switch (part.type) {
                      case "text":
                        return part.state === "streaming" ? (
                          <Shimmer key={index}>{part.text}</Shimmer>
                        ) : (
                          <MessageResponse key={index}>
                            {part.text}
                          </MessageResponse>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
