"use client";

import { useEffect, useState } from "react";
import { getConversations, createConversation, deleteConversation } from "@/lib/server/actions/conversations";
import { useRouter } from "next/navigation";

export default function AppSidebar() {
  const [conversations, setConversations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    getConversations().then(setConversations);
  }, []);

  const handleNewChat = async () => {
    const conv = await createConversation({});
    router.push(`/chat?id=${conv.id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    setConversations(conversations.filter(c => c.id !== id));
  };

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-4">
        <button onClick={handleNewChat} className="w-full bg-primary text-primary-foreground py-2 rounded-md">
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {conversations.map(conv => (
          <div key={conv.id} className="group p-2 hover:bg-muted rounded-md cursor-pointer text-sm flex justify-between items-center">
            <span className="truncate" onClick={() => router.push(`/chat?id=${conv.id}`)}>{conv.title}</span>
            <button className="hidden group-hover:block text-destructive text-xs" onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
