"use client";

import { FileText } from "lucide-react";

interface RenderDocumentProps {
  args: {
    title: string;
    content: string;
  };
  status: "inProgress" | "complete" | "executing";
}

export function RenderDocument({ args, status }: RenderDocumentProps) {
  const { title } = args;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <FileText className="h-5 w-5 text-amber-500" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">
          {title || "Generating document..."}
        </span>
        <span className="text-xs text-muted-foreground">
          {status === "inProgress" || status === "executing"
            ? "Writing content..."
            : "Document created"}
        </span>
      </div>
    </div>
  );
}
