"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getProjects, createProject, deleteProject } from "@/lib/server/actions/projects";
import { FolderKanban, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

type ProjectListItem = Awaited<ReturnType<typeof getProjects>>[number];

export default function ProjectsPage({ projects }: { projects: ProjectListItem[] }) {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createProject({ name, instructions });
    setName("");
    setInstructions("");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteProject(id);
    router.refresh();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              New project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Instructions</label>
                <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="System prompt for this project..." />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: ProjectListItem) => (
          <Card key={project.id}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(project.id)}>
                <Trash className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.instructions || "No instructions"}
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <FolderKanban className="h-3 w-3" />
                {project._count.conversations} chats
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
