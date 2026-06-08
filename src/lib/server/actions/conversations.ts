"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/session";

export async function getConversations() {
  const { userId } = await auth();
  if (!userId) return [];
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { pinnedAt: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { messages: true } } },
  });
}

export async function getConversation(id: string) {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function createConversation(data: { title?: string; model?: string; projectId?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const conv = await prisma.conversation.create({
    data: { userId, title: data.title || "New Chat", model: data.model || null, projectId: data.projectId || null },
  });
  revalidatePath("/chat");
  return conv;
}

export async function updateConversation(id: string, data: Partial<{ title: string; model: string; pinned: boolean; projectId: string }>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const update: Prisma.ConversationUpdateManyMutationInput = { ...data };
  if (data.pinned === true) update.pinnedAt = new Date();
  if (data.pinned === false) update.pinnedAt = null;
  const conv = await prisma.conversation.updateMany({
    where: { id, userId },
    data: update,
  });
  revalidatePath("/chat");
  return conv;
}

export async function deleteConversation(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.conversation.deleteMany({ where: { id, userId } });
  revalidatePath("/chat");
}
