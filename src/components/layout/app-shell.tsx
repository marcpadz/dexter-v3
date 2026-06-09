"use client";

import { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AppSidebar from "./app-sidebar";
import Header from "./header";
import WorkspacePanel from "@/components/workspace/workspace-panel";
import { useWorkspaceStore } from "@/components/workspace/workspace-store";

export default function AppShell({ children }: { children: ReactNode }) {
  const isOpen = useWorkspaceStore((s) => s.isOpen);
  const setPanelSize = useWorkspaceStore((s) => s.setPanelSize);

  return (
    <div className="h-screen w-full flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15}>
            <AppSidebar />
          </Panel>
          <PanelResizeHandle className="w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors" />
          <Panel defaultSize={isOpen ? 40 : 60} minSize={30}>
            {children}
          </Panel>
          {isOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors" />
              <Panel
                defaultSize={35}
                minSize={20}
                onResize={setPanelSize}
              >
                <WorkspacePanel />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
