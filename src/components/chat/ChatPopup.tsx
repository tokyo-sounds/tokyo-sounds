"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatPopupStore } from "@/stores/use-chat-popup-store";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";

// Page context descriptions for the AI
const PAGE_CONTEXTS: Record<string, string> = {
  "/": "The user is on the landing page, which showcases Tokyo Sounds - a flight simulation over Tokyo with AI-generated audio. The page has sections about the project, technologies used (Google 3D Tiles, Lyria audio), and team members.",
  "/about": "The user is on the About page, which explains the concept and design philosophy of Tokyo Sounds, including the team members who built it.",
  "/chat": "The user is on the dedicated Help/Chat page for asking questions about Tokyo Sounds.",
  "/patch": "The user is on the Changelog/Patch Notes page, which shows the development history and updates to Tokyo Sounds.",
  "/login": "The user is on the Login page.",
};

function getPageContext(pathname: string): string {
  // Check for exact match first
  if (PAGE_CONTEXTS[pathname]) {
    return PAGE_CONTEXTS[pathname];
  }
  
  // Check for locale-prefixed paths (e.g., /ja/about, /en/about)
  const pathWithoutLocale = pathname.replace(/^\/(en|ja|zh-CN|zh-TW)/, "");
  if (PAGE_CONTEXTS[pathWithoutLocale]) {
    return PAGE_CONTEXTS[pathWithoutLocale];
  }
  
  // Default context
  return "The user is browsing the Tokyo Sounds website.";
}

export function ChatPopup() {
  const pathname = usePathname();
  const { isOpen, isHidden, toggle, close, setPageContext } = useChatPopupStore();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update page context whenever pathname changes
  useEffect(() => {
    setPageContext(getPageContext(pathname));
  }, [pathname, setPageContext]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        pageContext: getPageContext(pathname),
      },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when popup opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage({ text: input, files: [] });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Don't render if hidden (e.g., during flight simulation)
  if (isHidden) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-9999"
          >
            <Button
              onClick={toggle}
              size="lg"
              className="size-14 rounded-full shadow-lg bg-white hover:bg-white border-none text-orange-500 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300"
            >
              <MessageCircle className="size-6 stroke-[2.5]" />
              <span className="sr-only">Open chat</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-9999 w-[380px] h-[520px] max-h-[80vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-orange-500 to-red-600 text-white">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5" />
                <div>
                  <h3 className="font-semibold text-sm">Tokyo Sounds</h3>
                  <p className="text-xs text-white/80">AIアシスタント</p>
                </div>
              </div>
              <Button
                onClick={close}
                size="icon"
                variant="ghost"
                className="size-8 text-white hover:bg-white/20 rounded-full"
              >
                <X className="size-4" />
                <span className="sr-only">Close chat</span>
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-zinc-400 p-4">
                  <MessageCircle className="size-12 mb-4 text-orange-500/50" />
                  <h4 className="font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Tokyo Soundsへようこそ
                  </h4>
                  <p className="text-sm">
                    プロジェクトについて何でもお聞きください
                  </p>
                </div>
              ) : (
                messages.map((message: UIMessage) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        "text-xs",
                        message.role === "user"
                          ? "bg-orange-100 dark:bg-orange-900/30"
                          : ""
                      )}
                    >
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-zinc-800">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="質問を入力..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                  style={{ maxHeight: "80px" }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="size-10 rounded-full bg-linear-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  <span className="sr-only">Send message</span>
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
