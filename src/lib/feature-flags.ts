/**
 * Feature flags control which tools are available per-conversation.
 * Stored as JSONB on the conversations table.
 */

export interface FeatureFlags {
  webSearch: boolean;
  browser: boolean;
  terminal: boolean;
  fileExplorer: boolean;
  git: boolean;
  memory: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  webSearch: true,
  browser: true,
  terminal: true,
  fileExplorer: true,
  git: true,
  memory: true,
};

export type FeatureFlagKey = keyof FeatureFlags;

export interface FeatureFlagDefinition {
  key: FeatureFlagKey;
  label: string;
  description: string;
  icon: string; // lucide icon name
  gatedTools: string[];
}

export const FEATURE_FLAG_DEFINITIONS: FeatureFlagDefinition[] = [
  {
    key: "webSearch",
    label: "Web Search",
    description: "Search the web for up-to-date information",
    icon: "globe",
    gatedTools: ["web_search"],
  },
  {
    key: "browser",
    label: "Browser",
    description: "Browse web pages and take screenshots",
    icon: "monitor",
    gatedTools: ["browse_web", "take_screenshot"],
  },
  {
    key: "terminal",
    label: "Terminal",
    description: "Execute shell commands and scripts",
    icon: "terminal",
    gatedTools: ["execute_code", "execute_command"],
  },
  {
    key: "fileExplorer",
    label: "File Explorer",
    description: "Read, write, and manage files in the sandbox",
    icon: "folder-tree",
    gatedTools: ["list_files", "read_file", "write_file", "delete_file"],
  },
  {
    key: "git",
    label: "Git",
    description: "Clone repos, manage branches, and commit changes",
    icon: "git-branch",
    gatedTools: ["git_clone", "git_status", "git_commit"],
  },
  {
    key: "memory",
    label: "Memory",
    description: "Save and recall persistent memories about you",
    icon: "brain",
    gatedTools: ["save_memory", "recall_memory"],
  },
];

export type ThinkingLevel = "none" | "low" | "medium" | "high";

export const THINKING_LEVELS: { value: ThinkingLevel; label: string; description: string }[] = [
  { value: "none", label: "Off", description: "No reasoning, fastest response" },
  { value: "low", label: "Low", description: "Light reasoning, quick answers" },
  { value: "medium", label: "Medium", description: "Balanced reasoning (default)" },
  { value: "high", label: "High", description: "Deep reasoning, more thorough" },
];

export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "medium";
