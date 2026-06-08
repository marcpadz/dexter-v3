"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/session";

export async function getProjects() {
  const { userId } = await auth();
  if (!userId) return [];
  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { conversations: true } } },
  });
}

export async function createProject(data: { name: string; instructions?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const project = await prisma.project.create({
    data: { userId, name: data.name, instructions: data.instructions || null },
  });
  revalidatePath("/projects");
  return project;
}

export async function updateProject(id: string, data: Partial<{ name: string; instructions: string }>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.project.updateMany({ where: { id, userId }, data });
  revalidatePath("/projects");
}

export async function deleteProject(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.project.deleteMany({ where: { id, userId } });
  revalidatePath("/projects");
}
