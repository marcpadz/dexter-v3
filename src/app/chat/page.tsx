"use client";

import { useChat } from "ai/react";
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createConversation } from "@/lib/server/actions/conversations";
import { Loader2, Send, User, Bot, Pin, Trash, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_MODELS = [
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "anthropic/claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "google/gemini-1.5-pro-latest", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "mistral/mistral-large-latest", name: "Mistral Large", provider: "Mistral" },
  { id: "groq/llama-3.1-70b-versatile", name: "Llama 3.1 70B", provider: "Groq" },
  { id: "xai/grok-beta", name: "Grok Beta", provider: "xAI" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek" },
  { id: "openrouter/anthropic/claude-3.5-sonnet", name: "Claude 3.5 (OR)", provider: "OpenRouter" },
];

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [model, setModel] = useState("openai/gpt-4o");
  const [title, setTitle] = useState("New Chat");

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: { model, conversationId },
    initialInput: prompt || "",
    onFinish: async (message) => {
      if (!conversationId) {
        const conv = await createConversation({ title: input.slice(0, 60) || "New Chat", model });
        setConversationId(conv.id);
        setTitle(conv.title);
        router.replace(`/chat?id=${conv.id}`);
      }
    },
  });

  const handleModelChange = useCallback((value: string) => {
    setModel(value);
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setTitle("New Chat");
    router.push("/chat");
  }, [setMessages, router]);

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
          {conversationId && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Pin className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select value={model} onValueChange={handleModelChange}>
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span>{m.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {m.provider}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            New chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">How can I help you today?</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Start a conversation with any model. You can switch models mid-chat.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-4">
              <Avatar className="h-7 w-7 mt-1">
                {msg.role === "user" ? (
                  <AvatarFallback className="bg-secondary text-xs">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Bot className="h-3.5 w-3.5" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {msg.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-4">
              <Avatar className="h-7 w-7 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex gap-3">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything…"
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="mx-auto max-w-3xl mt-2 text-[10px] text-muted-foreground text-center">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
