"use client";
import { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import AppShell from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <AppShell>{children}</AppShell>
    </CopilotKit>
  );
}
