"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

export async function getProjects() {
  const session = await requireAuth();
  const userId = session.user.id;

  return db.select().from(projects).where(eq(projects.userId, userId));
}

export async function createProject(data: { name: string; description?: string; instructions?: string }) {
  const session = await requireAuth();
  const userId = session.user.id;

  const [project] = await db.insert(projects).values({
    userId,
    name: data.name,
    description: data.description,
    instructions: data.instructions,
  }).returning();

  revalidatePath("/projects");
  return project;
}

export async function updateProject(id: string, data: Partial<{ name: string; description: string; instructions: string }>) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db.update(projects)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));

  revalidatePath("/projects");
}

export async function deleteProject(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
  revalidatePath("/projects");
}
