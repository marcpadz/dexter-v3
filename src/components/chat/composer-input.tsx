"use client";

import { useState, useRef, useMemo } from "react";
import type { InputProps } from "@copilotkit/react-ui";
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
import { Button } from "@/components/ui/button";

export function ComposerInput({
  inProgress,
  onSend,
  onStop,
}: InputProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(DEFAULT_THINKING_LEVEL);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const projects: Project[] = [];
  const knowledgebases: Knowledgebase[] = [];
  const mcpConnectors: McpConnector[] = [];

  const canSend = useMemo(
    () => !inProgress && text.trim().length > 0,
    [inProgress, text]
  );

  const handleSend = () => {
    if (!canSend) return;
    onSend(text);
    setText("");
    setAttachments([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleKbToggle = (id: string) => {
    setSelectedKbIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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
        onMcpToggle={() => {}}
        featureFlags={featureFlags}
        onFeatureFlagsChange={setFeatureFlags}
        thinkingLevel={thinkingLevel}
        onThinkingLevelChange={setThinkingLevel}
      />
      <div className="flex items-end gap-2 p-3 pt-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTextareaInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask the agent anything..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow max-h-[200px] overflow-y-auto"
        />
        {inProgress ? (
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
            disabled={!canSend}
            onClick={handleSend}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
