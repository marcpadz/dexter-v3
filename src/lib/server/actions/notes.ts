"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/session";

export async function getNotes() {
  const { userId } = await auth();
  if (!userId) return [];
  return prisma.note.findMany({
    where: { userId, isArchived: false },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createNote(data: { title: string; content?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const note = await prisma.note.create({
    data: { userId, title: data.title, content: data.content || "" },
  });
  revalidatePath("/notes");
  return note;
}

export async function updateNote(id: string, data: Partial<{ title: string; content: string; isArchived: boolean }>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.note.updateMany({ where: { id, userId }, data });
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.note.deleteMany({ where: { id, userId } });
  revalidatePath("/notes");
}
