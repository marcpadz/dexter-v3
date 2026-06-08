"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNotes, createNote, deleteNote } from "@/lib/server/actions/notes";
import { Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

type NoteListItem = Awaited<ReturnType<typeof getNotes>>[number];

export default function NotesPage({ notes }: { notes: NoteListItem[] }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createNote({ title, content });
    setTitle("");
    setContent("");
    setCreating(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    router.refresh();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
        <Button className="gap-1" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New note
        </Button>
      </div>

      {creating && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Textarea
                placeholder="Write something..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note: NoteListItem) => (
          <Card key={note.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-base font-semibold">{note.title}</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(note.id)}>
                <Trash className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {note.content || "No content"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
