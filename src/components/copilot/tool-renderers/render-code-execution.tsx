"use client";

import { Terminal } from "lucide-react";

interface RenderCodeExecutionProps {
  args: {
    command: string;
  };
  status: "inProgress" | "complete" | "executing";
}

export function RenderCodeExecution({
  args,
  status,
}: RenderCodeExecutionProps) {
  const { command } = args;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-zinc-950 p-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800">
        <Terminal className="h-5 w-5 text-zinc-400" />
      </div>
      <div className="flex flex-col gap-1 overflow-hidden flex-1">
        <div className="text-xs text-zinc-500 font-medium uppercase">
          {status === "inProgress" || status === "executing"
            ? "Executing"
            : "Executed"}
        </div>
        <div className="text-sm font-mono text-zinc-300 truncate bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
          $ {command || "..."}
        </div>
      </div>
    </div>
  );
}
