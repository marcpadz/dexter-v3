"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

export interface McpServerData {
  id: string;
  name: string;
  transport: "stdio" | "sse" | "http";
  command?: string;
  url?: string;
  enabled: boolean;
  status?: "connected" | "disconnected" | "error";
}

interface McpConnectorCardProps {
  server: McpServerData;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function McpConnectorCard({ server, onToggle, onEdit, onDelete }: McpConnectorCardProps) {
  const statusColor =
    server.status === "connected"
      ? "bg-green-500"
      : server.status === "error"
      ? "bg-red-500"
      : "bg-muted-foreground/40";

  const statusLabel =
    server.status === "connected"
      ? "Connected"
      : server.status === "error"
      ? "Error"
      : server.enabled
      ? "Disconnected"
      : "Disabled";

  const statusVariant =
    server.status === "connected"
      ? "default"
      : server.status === "error"
      ? "destructive"
      : "outline";

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:shadow-sm transition-shadow">
      <span className={cn("h-2 w-2 rounded-full shrink-0", server.status === "connected" && "animate-pulse", statusColor)} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{server.name}</div>
        <div className="text-xs text-muted-foreground">
          {server.transport} &middot; {server.command || server.url || "Not configured"}
        </div>
      </div>
      <Badge variant={statusVariant as "default" | "destructive" | "outline"} className="text-[10px]">
        {statusLabel}
      </Badge>
      <Switch
        checked={server.enabled}
        onCheckedChange={(checked) => onToggle(server.id, checked === true)}
        size="sm"
      />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(server.id)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(server.id)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
