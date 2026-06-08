"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { getTasks, createTask, updateTask, deleteTask } from "@/lib/server/actions/tasks";
import { Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

type TaskListItem = Awaited<ReturnType<typeof getTasks>>[number];

export default function TasksPage({ tasks }: { tasks: TaskListItem[] }) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createTask({ title });
    setTitle("");
    setCreating(false);
    router.refresh();
  }

  async function toggleTask(id: string, completed: boolean) {
    await updateTask(id, { completed: !completed });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    router.refresh();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <Button className="gap-1" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </div>

      {creating && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex gap-2">
              <Input
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Button type="submit">Add</Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {tasks.map((task: TaskListItem) => (
          <Card key={task.id} className="flex items-center gap-3 px-4 py-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id, task.completed)}
            />
            <span className={task.completed ? "line-through text-muted-foreground" : ""}>
              {task.title}
            </span>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(task.id)}>
              <Trash className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
