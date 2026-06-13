"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search, BookOpen } from "lucide-react";

export interface KnowledgebaseData {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  enabled: boolean;
  createdAt?: string;
}

interface KnowledgebaseCardProps {
  kb: KnowledgebaseData;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function KnowledgebaseCard({ kb, onToggle, onEdit, onDelete }: KnowledgebaseCardProps) {
  return (
    <div className="p-4 rounded-lg border border-border bg-background hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-medium truncate">{kb.name}</h3>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {kb.documentCount} docs
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Switch
            checked={kb.enabled}
            onCheckedChange={(checked) => onToggle(kb.id, checked === true)}
            size="sm"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(kb.id)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(kb.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {kb.description && (
        <p className="text-xs text-muted-foreground mb-3">{kb.description}</p>
      )}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Test search..."
            className="h-7 pl-7 text-xs"
          />
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <BookOpen className="h-3 w-3" /> Browse Docs
        </Button>
      </div>
      {kb.createdAt && (
        <p className="text-[10px] text-muted-foreground/60 mt-2">Created {kb.createdAt}</p>
      )}
    </div>
  );
}
