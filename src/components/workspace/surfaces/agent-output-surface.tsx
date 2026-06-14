"use client";

import { useWorkspaceStore } from "../workspace-store";
import { Button } from "@/components/ui/button";
import { Bot, Trash2, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AgentOutputSurface() {
  const { agentOutputStream, agentOutputMetadata, clearAgentOutput } =
    useWorkspaceStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Agent output stream</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => navigator.clipboard.writeText(agentOutputStream)}
            disabled={!agentOutputStream}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={clearAgentOutput}
            disabled={!agentOutputStream}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Output stream */}
      {agentOutputStream ? (
        <div className="border rounded-lg p-3 bg-muted/10">
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
            <ReactMarkdown>{agentOutputStream}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Bot className="h-8 w-8 mb-2" />
          <p className="text-sm">No agent output</p>
          <p className="text-xs">Agent activity will stream here</p>
        </div>
      )}

      {/* Metadata display */}
      {Object.keys(agentOutputMetadata).length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Metadata
          </summary>
          <pre className="mt-1 bg-muted/30 rounded p-2 font-mono text-[10px] overflow-x-auto">
            {JSON.stringify(agentOutputMetadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
