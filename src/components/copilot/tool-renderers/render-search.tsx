"use client";

import { Search, ExternalLink } from "lucide-react";

interface RenderSearchProps {
  args: {
    query: string;
  };
  status: "inProgress" | "complete" | "executing";
}

export function RenderSearch({ args, status }: RenderSearchProps) {
  const { query } = args;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <Search className="h-5 w-5 text-indigo-500" />
      </div>
      <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
        <span className="text-sm font-medium truncate">
          {query ? `Searching for "${query}"` : "Searching web..."}
        </span>
        <span className="text-xs text-muted-foreground">
          {status === "inProgress" || status === "executing"
            ? "Looking up information..."
            : "Found results"}
        </span>
      </div>
      {status === "complete" && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
