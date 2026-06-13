"use client";

import { useCallback, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, Clipboard, UploadCloud, X } from "lucide-react";

export interface Attachment {
  id: string;
  name: string;
  type: "file" | "image" | "text";
  size: number;
  preview?: string;
}

interface AttachmentMenuProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function AttachmentMenu({ attachments, onAttachmentsChange }: AttachmentMenuProps) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
      const files = e.target.files;
      if (!files) return;
      const newAttachments: Attachment[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type,
        size: file.size,
      }));
      onAttachmentsChange([...attachments, ...newAttachments]);
      setOpen(false);
    },
    [attachments, onAttachmentsChange]
  );

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const attachment: Attachment = {
          id: crypto.randomUUID(),
          name: "Pasted text",
          type: "text",
          size: text.length,
          preview: text.slice(0, 100),
        };
        onAttachmentsChange([...attachments, attachment]);
      }
    } catch {
      // Clipboard API not available
    }
    setOpen(false);
  }, [attachments, onAttachmentsChange]);

  const removeAttachment = useCallback(
    (id: string) => {
      onAttachmentsChange(attachments.filter((a) => a.id !== id));
    },
    [attachments, onAttachmentsChange]
  );

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1.5 text-muted-foreground" />
          }
        >
          <Paperclip className="h-4 w-4" />
          <span className="hidden sm:inline">Attach</span>
          {attachments.length > 0 && (
            <span className="ml-1 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-1">
              {attachments.length}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-64 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Attach Files</p>
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">
              Drag & drop or <span className="text-primary">browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">PDF, TXT, MD, CSV, JSON</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.csv,.json"
            multiple
            onChange={(e) => handleFileSelect(e, "file")}
          />
          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e, "image")}
          />
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image className="h-3.5 w-3.5" /> Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1"
              onClick={handlePaste}
            >
              <Clipboard className="h-3.5 w-3.5" /> Paste
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Attachment chips */}
      {attachments.map((att) => (
        <span
          key={att.id}
          className="inline-flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-1 max-w-[140px]"
        >
          <span className="truncate">{att.name}</span>
          <button
            onClick={() => removeAttachment(att.id)}
            className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
