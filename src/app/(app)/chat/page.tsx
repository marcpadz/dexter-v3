"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useWorkspaceTools } from "@/components/copilot/frontend-tools";
import "@copilotkit/react-ui/styles.css";

export default function ChatPage() {
  useWorkspaceTools();

  return (
    <div className="h-full">
      <CopilotChat
        className="h-full"
        labels={{
          title: "Dexter",
          initial: "Hello! I'm Dexter, your AI workspace assistant. How can I help you today?",
        }}
      />
    </div>
  );
}
