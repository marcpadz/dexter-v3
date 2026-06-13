"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useWorkspaceTools } from "@/components/copilot/frontend-tools";
import { ComposerInput } from "@/components/chat/composer-input";
import "@copilotkit/react-ui/styles.css";

export default function ChatPage() {
  useWorkspaceTools();

  return (
    <div className="h-full flex flex-col">
      <CopilotChat
        className="h-full flex flex-col"
        labels={{
          title: "Dexter",
          initial: "Hello! I'm Dexter, your AI workspace assistant. How can I help you today?",
        }}
        Input={ComposerInput}
      />
    </div>
  );
}
