"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KnowledgebaseData } from "./knowledgebase-card";
import { UploadCloud, FileText, Link2 } from "lucide-react";

interface KnowledgebaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kb?: KnowledgebaseData | null;
  onSave: (data: { name: string; description: string; sourceType: string }) => void;
}

export function KnowledgebaseDialog({ open, onOpenChange, kb, onSave }: KnowledgebaseDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("upload");
  const isEdit = !!kb;

  useEffect(() => {
    if (kb) {
      setName(kb.name);
      setDescription(kb.description || "");
    } else {
      setName("");
      setDescription("");
      setSourceType("upload");
    }
  }, [kb, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Knowledgebase" : "Create Knowledgebase"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your knowledgebase settings."
              : "Create a knowledgebase to give Dexter custom knowledge."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kb-name">Name</Label>
            <Input
              id="kb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="API Documentation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kb-desc">Description</Label>
            <Textarea
              id="kb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this knowledgebase..."
              rows={2}
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select value={sourceType} onValueChange={(v) => v && setSourceType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">Upload Files</SelectItem>
                  <SelectItem value="paste">Paste Text</SelectItem>
                  <SelectItem value="url">Connect URL</SelectItem>
                  <SelectItem value="project">Import from Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isEdit && sourceType === "upload" && (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF, TXT, MD, CSV, JSON</p>
            </div>
          )}

          {!isEdit && sourceType === "paste" && (
            <Textarea
              placeholder="Paste your text content here..."
              rows={4}
            />
          )}

          {!isEdit && sourceType === "url" && (
            <Input placeholder="https://docs.example.com" />
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => { onSave({ name, description, sourceType }); onOpenChange(false); }} disabled={!name}>
            {isEdit ? "Save Changes" : "Create & Ingest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
