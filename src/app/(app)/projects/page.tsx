"use client";

import { useState, useEffect } from "react";
import { getProjects, createProject, deleteProject } from "@/lib/server/actions/projects";
import { type Project } from "@/lib/db/schema/projects";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [newProject, setNewProject] = useState({ name: "", description: "", instructions: "" });

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (e) {
      console.error(e);
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const handleCreate = async () => {
    if (!newProject.name) return;
    try {
      await createProject(newProject);
      toast.success("Project created");
      setNewProject({ name: "", description: "", instructions: "" });
      const updated = await getProjects();
      setProjects(updated);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create project");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success("Project deleted");
      const updated = await getProjects();
      setProjects(updated);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete project");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>Projects group your conversations, tasks, and documents together with shared system instructions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={newProject.name} onChange={e => setNewProject(p => ({...p, name: e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={newProject.description} onChange={e => setNewProject(p => ({...p, description: e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">System Instructions</Label>
            <Textarea id="instructions" placeholder="e.g. Always write code in TypeScript..." value={newProject.instructions} onChange={e => setNewProject(p => ({...p, instructions: e.target.value}))} />
          </div>
          <Button onClick={handleCreate} disabled={!newProject.name}>
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 ? (
          <p className="text-muted-foreground col-span-2 text-center py-8 border rounded-lg bg-slate-50">No projects yet.</p>
        ) : (
          projects.map(project => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{project.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="text-red-500 -mt-2 -mr-2" onClick={() => handleDelete(project.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{project.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-3">{project.instructions || "No instructions provided."}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
