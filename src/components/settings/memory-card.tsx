"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash2,
  Brain,
  Check,
  X,
} from "lucide-react";

export interface MemoryItem {
  id: string;
  content: string;
  category: "preference" | "fact" | "behavior" | "context";
  createdAt: string;
  updatedAt?: string;
}

interface MemoryCardProps {
  memory: MemoryItem;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_VARIANTS: Record<MemoryItem["category"], "default" | "secondary" | "outline" | "ghost"> = {
  preference: "default",
  fact: "secondary",
  behavior: "outline",
  context: "ghost",
};

export function MemoryCard({ memory, onUpdate, onDelete }: MemoryCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(memory.content);

  const handleSave = () => {
    if (editValue.trim() && editValue !== memory.content) {
      onUpdate(memory.id, editValue.trim());
    } else {
      setEditValue(memory.content);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(memory.content);
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:shadow-sm transition-shadow group">
      <Brain className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-start gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-green-500 hover:text-green-600"
              onClick={handleSave}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{memory.content}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge
            variant={CATEGORY_VARIANTS[memory.category]}
            className="text-[10px] capitalize"
          >
            {memory.category}
          </Badge>
          <span className="text-[10px] text-muted-foreground/60">
            {memory.createdAt}
          </span>
        </div>
      </div>
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(memory.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
