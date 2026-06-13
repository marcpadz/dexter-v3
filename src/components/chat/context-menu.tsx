"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  FolderGit2,
  BookOpen,
  Plug,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Project {
  id: string;
  name: string;
}

export interface Knowledgebase {
  id: string;
  name: string;
}

export interface McpConnector {
  id: string;
  name: string;
  enabled: boolean;
}

interface ContextMenuProps {
  projects: Project[];
  knowledgebases: Knowledgebase[];
  mcpConnectors: McpConnector[];
  selectedProjectId: string | null;
  selectedKbIds: string[];
  onProjectSelect: (id: string | null) => void;
  onKbToggle: (id: string) => void;
  onMcpToggle: (id: string) => void;
}

export function ContextMenu({
  projects,
  knowledgebases,
  mcpConnectors,
  selectedProjectId,
  selectedKbIds,
  onProjectSelect,
  onKbToggle,
  onMcpToggle,
}: ContextMenuProps) {
  const [open, setOpen] = useState(false);

  const activeCount =
    (selectedProjectId ? 1 : 0) +
    selectedKbIds.length +
    mcpConnectors.filter((m) => m.enabled).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1.5 text-muted-foreground"
          />
        }
      >
        <FolderGit2 className="h-4 w-4" />
        <span className="hidden sm:inline">Context</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {activeCount}
          </Badge>
        )}
        <ChevronDown className="h-3 w-3" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 p-0">
        <div className="max-h-80 overflow-y-auto">
          {/* Projects section */}
          <div className="p-3 border-b">
            <div className="flex items-center gap-1.5 mb-2">
              <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Projects
              </span>
            </div>
            <div className="space-y-0.5">
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={cn(
                    "flex items-center gap-2 w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-muted transition-colors",
                    selectedProjectId === p.id && "bg-muted font-medium"
                  )}
                  onClick={() => {
                    onProjectSelect(
                      selectedProjectId === p.id ? null : p.id
                    );
                  }}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                      selectedProjectId === p.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    {selectedProjectId === p.id && (
                      <Check className="h-3 w-3" />
                    )}
                  </span>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">
                  No projects available
                </p>
              )}
            </div>
          </div>

          {/* Knowledgebases section */}
          <div className="p-3 border-b">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Knowledgebases
              </span>
            </div>
            <div className="space-y-0.5">
              {knowledgebases.map((kb) => {
                const isSelected = selectedKbIds.includes(kb.id);
                return (
                  <button
                    key={kb.id}
                    className={cn(
                      "flex items-center gap-2 w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-muted transition-colors",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => onKbToggle(kb.id)}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{kb.name}</span>
                  </button>
                );
              })}
              {knowledgebases.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">
                  No knowledgebases configured
                </p>
              )}
            </div>
          </div>

          {/* MCP Connectors section */}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Plug className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                MCP Connectors
              </span>
            </div>
            <div className="space-y-1">
              {mcpConnectors.map((mcp) => (
                <div
                  key={mcp.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <span className="text-sm truncate">{mcp.name}</span>
                  <Switch
                    checked={mcp.enabled}
                    onCheckedChange={() => onMcpToggle(mcp.id)}
                    size="sm"
                  />
                </div>
              ))}
              {mcpConnectors.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">
                  No MCP connectors configured
                </p>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
