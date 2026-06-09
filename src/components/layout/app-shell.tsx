"use client";

import { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AppSidebar from "./app-sidebar";
import Header from "./header";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15}>
            <AppSidebar />
          </Panel>
          <PanelResizeHandle className="w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors" />
          <Panel defaultSize={45} minSize={30}>
            {children}
          </Panel>
          <PanelResizeHandle className="w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors" />
          <Panel defaultSize={35} minSize={20} collapsible={true}>
            <div className="h-full bg-muted/20 flex items-center justify-center text-muted-foreground">
              Workspace Panel (Collapsed initially)
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
