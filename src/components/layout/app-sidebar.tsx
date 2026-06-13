"use client";

import { useEffect, useState } from "react";
import { getConversations, createConversation, deleteConversation } from "@/lib/server/actions/conversations";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  MessageSquare,
  FolderKanban,
  Settings,
  Trash2,
  Loader2,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppSidebar() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  const handleNewChat = async () => {
    setCreating(true);
    try {
      const conv = await createConversation({});
      router.push(`/chat?id=${conv.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    setConversations(conversations.filter((c) => c.id !== id));
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Brand */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm">Dexter</span>
      </div>

      {/* New Chat button */}
      <div className="px-3 py-2">
        <Button
          onClick={handleNewChat}
          disabled={creating}
          className="w-full gap-2 h-9"
          size="sm"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Chat
        </Button>
      </div>

      <Separator />

      {/* Conversations list */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const convPath = `/chat?id=${conv.id}`;
              const active = pathname === "/chat" && typeof window !== "undefined" && window.location.search.includes(conv.id);
              return (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  onClick={() => router.push(convPath)}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{conv.title || "Untitled"}</span>
                  <button
                    className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conv.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Navigation links */}
      <div className="p-2 space-y-0.5">
        <button
          onClick={() => router.push("/projects")}
          className={cn(
            "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm transition-colors",
            isActive("/projects")
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <FolderKanban className="h-4 w-4" />
          Projects
        </button>
        <button
          onClick={() => router.push("/settings")}
          className={cn(
            "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm transition-colors",
            isActive("/settings")
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </div>
  );
}
