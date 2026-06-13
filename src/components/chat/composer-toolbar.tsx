"use client";

import { AttachmentMenu, type Attachment } from "./attachment-menu";
import {
  ContextMenu,
  type Project,
  type Knowledgebase,
  type McpConnector,
} from "./context-menu";
import { FeatureFlagMenu } from "./feature-flag-menu";
import { ThinkingLevelSelector } from "./thinking-level-selector";
import type { FeatureFlags, ThinkingLevel } from "@/lib/feature-flags";

interface ComposerToolbarProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  projects: Project[];
  knowledgebases: Knowledgebase[];
  mcpConnectors: McpConnector[];
  selectedProjectId: string | null;
  selectedKbIds: string[];
  onProjectSelect: (id: string | null) => void;
  onKbToggle: (id: string) => void;
  onMcpToggle: (id: string) => void;
  featureFlags: FeatureFlags;
  onFeatureFlagsChange: (flags: FeatureFlags) => void;
  thinkingLevel: ThinkingLevel;
  onThinkingLevelChange: (level: ThinkingLevel) => void;
}

export function ComposerToolbar({
  attachments,
  onAttachmentsChange,
  projects,
  knowledgebases,
  mcpConnectors,
  selectedProjectId,
  selectedKbIds,
  onProjectSelect,
  onKbToggle,
  onMcpToggle,
  featureFlags,
  onFeatureFlagsChange,
  thinkingLevel,
  onThinkingLevelChange,
}: ComposerToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
      <AttachmentMenu
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
      />
      <ContextMenu
        projects={projects}
        knowledgebases={knowledgebases}
        mcpConnectors={mcpConnectors}
        selectedProjectId={selectedProjectId}
        selectedKbIds={selectedKbIds}
        onProjectSelect={onProjectSelect}
        onKbToggle={onKbToggle}
        onMcpToggle={onMcpToggle}
      />
      <FeatureFlagMenu
        flags={featureFlags}
        onFlagsChange={onFeatureFlagsChange}
      />
      <ThinkingLevelSelector
        value={thinkingLevel}
        onChange={onThinkingLevelChange}
      />
    </div>
  );
}
