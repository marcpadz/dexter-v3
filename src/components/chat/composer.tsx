"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ComposerToolbar } from "./composer-toolbar";
import type { Attachment } from "./attachment-menu";
import type { Project, Knowledgebase, McpConnector } from "./context-menu";
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_THINKING_LEVEL,
  type FeatureFlags,
  type ThinkingLevel,
} from "@/lib/feature-flags";
import { ArrowUp, Square } from "lucide-react";

export interface ComposerContext {
  selectedProjectId: string | null;
  selectedKbIds: string[];
  featureFlags: FeatureFlags;
  thinkingLevel: ThinkingLevel;
  attachments: Attachment[];
}

interface ComposerProps {
  onSend: (message: string, context: ComposerContext) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  projects?: Project[];
  knowledgebases?: Knowledgebase[];
  mcpConnectors?: McpConnector[];
  placeholder?: string;
}

export function Composer({
  onSend,
  onStop,
  isGenerating = false,
  projects = [],
  knowledgebases = [],
  mcpConnectors = [],
  placeholder = "Ask the agent anything...",
}: ComposerProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(DEFAULT_THINKING_LEVEL);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, {
      selectedProjectId,
      selectedKbIds,
      featureFlags,
      thinkingLevel,
      attachments,
    });
    setMessage("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [message, attachments, selectedProjectId, selectedKbIds, featureFlags, thinkingLevel, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isGenerating) handleSend();
      }
    },
    [handleSend, isGenerating]
  );

  const handleTextareaInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const handleKbToggle = useCallback((id: string) => {
    setSelectedKbIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleMcpToggle = useCallback(
    (id: string) => {
      // MCP toggling is handled at a higher level; here we just track local state
      // In a real app this would call back to parent or update store
    },
    []
  );

  return (
    <div className="border-t border-border bg-background">
      <ComposerToolbar
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        projects={projects}
        knowledgebases={knowledgebases}
        mcpConnectors={mcpConnectors}
        selectedProjectId={selectedProjectId}
        selectedKbIds={selectedKbIds}
        onProjectSelect={setSelectedProjectId}
        onKbToggle={handleKbToggle}
        onMcpToggle={handleMcpToggle}
        featureFlags={featureFlags}
        onFeatureFlagsChange={setFeatureFlags}
        thinkingLevel={thinkingLevel}
        onThinkingLevelChange={setThinkingLevel}
      />
      <div className="flex items-end gap-2 p-3 pt-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTextareaInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow max-h-[200px] overflow-y-auto"
        />
        {isGenerating ? (
          <Button
            size="icon"
            variant="destructive"
            className="h-9 w-9 shrink-0"
            onClick={onStop}
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!message.trim() && attachments.length === 0}
            onClick={handleSend}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
