"use client";

import { useState } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotChat } from "@copilotkit/react-core";
import { ModelSelector } from "@/components/copilot/model-selector";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const [modelId, setModelId] = useState("openai/gpt-4o");

  const { isLoading } = useCopilotChat();

  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center px-4 py-3 border-b">
        <div>
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && (
             <div className="flex items-center text-sm text-muted-foreground mr-4">
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 <span>Agent is working...</span>
             </div>
          )}
          <ModelSelector value={modelId} onChange={setModelId} />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
         <CopilotChat
            labels={{
                initial: "Hello! I'm Dexter, your agentic workspace assistant.",
            }}
            // You can pass the selected modelId through request headers or body here
            // based on how CopilotRuntime is configured to receive it
         />
      </div>
    </div>
  );
}
