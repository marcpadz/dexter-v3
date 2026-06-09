"use client";

import { useWorkspaceStore, type WorkspaceFile } from "../workspace-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderTree,
  File,
  Folder,
  ChevronRight,
  ArrowUp,
} from "lucide-react";

export default function FilesSurface() {
  const { files, currentPath, selectedFilePath, setCurrentPath, setSelectedFilePath } =
    useWorkspaceStore();

  const directories = files.filter((f) => f.isDir);
  const regularFiles = files.filter((f) => !f.isDir);
  const sorted = [...directories, ...regularFiles];

  const handleNavigate = (file: WorkspaceFile) => {
    if (file.isDir) {
      setCurrentPath(file.path);
      // The agent's list_files tool will populate via CopilotKit action
    } else {
      setSelectedFilePath(file.path);
      // The agent's read_file tool will populate content via CopilotKit action
    }
  };

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setCurrentPath(null)}
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <span className="font-mono truncate">
          {currentPath || "/"}
        </span>
      </div>

      {/* File list */}
      {sorted.length > 0 ? (
        <div className="border rounded-lg divide-y">
          {sorted.map((file) => (
            <Button
              key={file.path}
              variant="ghost"
              size="sm"
              className={`w-full h-8 justify-start px-3 text-xs font-normal ${
                selectedFilePath === file.path ? "bg-muted" : ""
              }`}
              onClick={() => handleNavigate(file)}
            >
              {file.isDir ? (
                <Folder className="h-3.5 w-3.5 mr-2 text-blue-400" />
              ) : (
                <File className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              )}
              <span className="truncate">{file.name}</span>
              {!file.isDir && (
                <span className="ml-auto text-muted-foreground">
                  {formatSize(file.size)}
                </span>
              )}
              {file.isDir && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <FolderTree className="h-8 w-8 mb-2" />
          <p className="text-sm">No files loaded</p>
          <p className="text-xs">Ask Dexter to explore a directory</p>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
