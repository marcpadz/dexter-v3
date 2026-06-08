"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/session";

export async function getTasks() {
  const { userId } = await auth();
  if (!userId) return [];
  return prisma.task.findMany({
    where: { userId },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
  });
}

export async function createTask(data: { title: string; priority?: string; dueDate?: Date }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const task = await prisma.task.create({
    data: { userId, title: data.title, priority: data.priority || null, dueDate: data.dueDate || null },
  });
  revalidatePath("/tasks");
  return task;
}

export async function updateTask(id: string, data: Partial<{ title: string; completed: boolean; priority: string; dueDate: Date }>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.task.updateMany({ where: { id, userId }, data });
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.task.deleteMany({ where: { id, userId } });
  revalidatePath("/tasks");
}
