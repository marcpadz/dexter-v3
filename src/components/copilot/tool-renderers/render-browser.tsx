"use client";

import { Globe } from "lucide-react";

interface RenderBrowserProps {
  args: {
    url: string;
  };
  status: "inProgress" | "complete" | "executing";
}

export function RenderBrowser({ args, status }: RenderBrowserProps) {
  const { url } = args;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <Globe className="h-5 w-5 text-blue-500" />
      </div>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <span className="text-sm font-medium truncate">
          {url || "Opening browser..."}
        </span>
        <span className="text-xs text-muted-foreground">
          {status === "inProgress" || status === "executing"
            ? "Loading page..."
            : "Page loaded"}
        </span>
      </div>
    </div>
  );
}
