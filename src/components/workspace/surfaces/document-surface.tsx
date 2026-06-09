"use client";

import { useWorkspaceStore } from "../workspace-store";
import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bold, Italic, List, Heading2, Save, FileText } from "lucide-react";

export default function DocumentSurface() {
  const {
    documentContent,
    documentTitle,
    setDocumentContent,
    setDocumentTitle,
  } = useWorkspaceStore();

  const editor = useEditor({
    extensions: [StarterKit],
    content: documentContent,
    onUpdate: ({ editor }) => {
      setDocumentContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-3",
      },
    },
  });

  // Sync content from store (when agent sets it)
  const prevContent = useRef(documentContent);
  useEffect(() => {
    if (documentContent !== prevContent.current && editor) {
      const currentEditorHTML = editor.getHTML();
      if (documentContent !== currentEditorHTML) {
        editor.commands.setContent(documentContent);
      }
      prevContent.current = documentContent;
    }
  }, [documentContent, editor]);

  return (
    <div className="space-y-3">
      {/* Title */}
      <Input
        value={documentTitle}
        onChange={(e) => setDocumentTitle(e.target.value)}
        className="h-8 text-sm font-medium"
        placeholder="Document title..."
      />

      {/* Toolbar */}
      <div className="flex gap-1 border rounded-lg p-1 bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor */}
      <div className="border rounded-lg min-h-[200px]">
        <EditorContent editor={editor} />
      </div>

      {!documentContent && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Empty document</p>
            <p className="text-xs">Start typing or ask Dexter to write</p>
          </div>
        </div>
      )}
    </div>
  );
}
