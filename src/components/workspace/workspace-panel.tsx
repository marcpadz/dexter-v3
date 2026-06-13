"use client";

import { useWorkspaceStore, type WorkspaceTab } from "./workspace-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ArtifactSurface from "./surfaces/artifact-surface";
import BrowserSurface from "./surfaces/browser-surface";
import DocumentSurface from "./surfaces/document-surface";
import TerminalSurface from "./surfaces/terminal-surface";
import FilesSurface from "./surfaces/files-surface";
import AgentOutputSurface from "./surfaces/agent-output-surface";
import KnowledgebaseSurface from "./surfaces/knowledgebase-surface";
import {
  Code2,
  Globe,
  FileText,
  Terminal,
  FolderTree,
  Bot,
  BookOpen,
} from "lucide-react";

const TABS: { value: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
  { value: "artifacts", label: "Artifacts", icon: <Code2 className="h-3.5 w-3.5" /> },
  { value: "browser", label: "Browser", icon: <Globe className="h-3.5 w-3.5" /> },
  { value: "document", label: "Document", icon: <FileText className="h-3.5 w-3.5" /> },
  { value: "terminal", label: "Terminal", icon: <Terminal className="h-3.5 w-3.5" /> },
  { value: "files", label: "Files", icon: <FolderTree className="h-3.5 w-3.5" /> },
  { value: "agent-output", label: "Agent", icon: <Bot className="h-3.5 w-3.5" /> },
  { value: "knowledgebase", label: "KB", icon: <BookOpen className="h-3.5 w-3.5" /> },
];

export default function WorkspacePanel() {
  const { isOpen, activeTab, setActiveTab } = useWorkspaceStore();

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as WorkspaceTab)}
        className="flex flex-col h-full"
      >
        <div className="border-b px-2 pt-2">
          <TabsList className="h-8 w-full justify-start gap-0.5 bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-7 px-2 text-xs gap-1 data-[state=active]:bg-muted"
              >
                {tab.icon}
                <span className="hidden xl:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3">
            {activeTab === "artifacts" && <ArtifactSurface />}
            {activeTab === "browser" && <BrowserSurface />}
            {activeTab === "document" && <DocumentSurface />}
            {activeTab === "terminal" && <TerminalSurface />}
            {activeTab === "files" && <FilesSurface />}
            {activeTab === "agent-output" && <AgentOutputSurface />}
            {activeTab === "knowledgebase" && <KnowledgebaseSurface />}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
