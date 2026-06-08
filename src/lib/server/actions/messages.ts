"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/session";

export async function getMessages(conversationId: string) {
  const { userId } = await auth();
  if (!userId) return [];
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  return conv?.messages ?? [];
}

export async function createMessage(data: {
  conversationId: string;
  role: string;
  content: string;
  model?: string;
  messageGroupId?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const conv = await prisma.conversation.findFirst({
    where: { id: data.conversationId, userId },
  });
  if (!conv) throw new Error("Conversation not found");
  return prisma.message.create({
    data: {
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      model: data.model || null,
      messageGroupId: data.messageGroupId || "main",
    },
  });
}

export async function deleteMessage(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const msg = await prisma.message.findUnique({ where: { id }, include: { conversation: true } });
  if (!msg || msg.conversation.userId !== userId) throw new Error("Unauthorized");
  await prisma.message.delete({ where: { id } });
}
