"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export default function ChatPage() {
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
