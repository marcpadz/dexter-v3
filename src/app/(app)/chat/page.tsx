"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import { useWorkspaceTools } from "@/components/copilot/frontend-tools";
import "@copilotkit/react-ui/styles.css";

export default function ChatPage() {
  useWorkspaceTools();

  return (
    <div className="h-full flex flex-col">
      <CopilotChat
        labels={{
          title: "Dexter Agent",
          initial: "Hello! How can I assist you today?",
        }}
      />
    </div>
  );
}
