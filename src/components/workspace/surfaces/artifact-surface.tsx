"use client";

import { useWorkspaceStore, type ArtifactType } from "../workspace-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Copy, Code2, FileCode, Image, GitCompare, Braces } from "lucide-react";
import ReactMarkdown from "react-markdown";

const ARTIFACT_ICONS: Record<ArtifactType, React.ReactNode> = {
  code: <Code2 className="h-4 w-4" />,
  html: <FileCode className="h-4 w-4" />,
  svg: <Image className="h-4 w-4" />,
  react: <Braces className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  diff: <GitCompare className="h-4 w-4" />,
  mermaid: <Code2 className="h-4 w-4" />,
};

function ArtifactViewer() {
  const { artifacts, activeArtifactId, setActiveArtifact, removeArtifact, updateArtifact } =
    useWorkspaceStore();

  const active = artifacts.find((a) => a.id === activeArtifactId);

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <Code2 className="h-8 w-8 mb-2" />
        <p className="text-sm">No artifacts yet</p>
        <p className="text-xs">Ask Dexter to create something</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Artifact list */}
      <div className="flex gap-1 flex-wrap">
        {artifacts.map((a) => (
          <Button
            key={a.id}
            variant={a.id === activeArtifactId ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setActiveArtifact(a.id)}
          >
            {ARTIFACT_ICONS[a.type]}
            {a.title}
            <span
              className="ml-1 hover:bg-destructive/20 rounded p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                removeArtifact(a.id);
              }}
            >
              <X className="h-3 w-3" />
            </span>
          </Button>
        ))}
      </div>

      {/* Active artifact content */}
      {active && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 border-b">
            <span className="text-xs font-medium">{active.title}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => navigator.clipboard.writeText(active.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-3">
              {active.type === "html" || active.type === "svg" ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: active.content }}
                />
              ) : active.type === "mermaid" ? (
                <pre className="text-xs font-mono bg-muted/30 p-3 rounded overflow-x-auto">
                  {active.content}
                </pre>
              ) : active.type === "image" ? (
                <img
                  src={active.content}
                  alt={active.title}
                  className="max-w-full rounded"
                />
              ) : (
                <pre className="text-xs font-mono bg-muted/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {active.content}
                </pre>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default function ArtifactSurface() {
  return <ArtifactViewer />;
}
