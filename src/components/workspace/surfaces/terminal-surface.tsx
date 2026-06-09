"use client";

import { useWorkspaceStore } from "../workspace-store";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal as TerminalIcon, Trash2, Copy } from "lucide-react";

export default function TerminalSurface() {
  const { terminalOutput, appendTerminalOutput, terminalSessionId } =
    useWorkspaceStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const handleCopy = () => {
    navigator.clipboard.writeText(terminalOutput);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {terminalSessionId ? `Session: ${terminalSessionId.slice(0, 8)}` : "No active session"}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCopy}
            disabled={!terminalOutput}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => useWorkspaceStore.setState({ terminalOutput: "" })}
            disabled={!terminalOutput}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="bg-zinc-950 text-green-400 font-mono text-xs rounded-lg p-3 min-h-[200px] max-h-[60vh] overflow-y-auto whitespace-pre-wrap"
      >
        {terminalOutput || (
          <span className="text-zinc-500">
            Terminal output will appear here when Dexter executes code...
          </span>
        )}
      </div>
    </div>
  );
}
