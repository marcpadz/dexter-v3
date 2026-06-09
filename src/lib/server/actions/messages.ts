"use server";

import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema/messages";
import { conversations } from "@/lib/db/schema/conversations";
import { eq, asc, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function getMessages(conversationId: string) {
  const session = await getSession();
  if (!session) return [];

  const conv = await db.select().from(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.userId, session.user.id))).limit(1);
  if (!conv.length) return [];

  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
}

export async function createMessage(data: {
  conversationId: string;
  role: string;
  content: string;
  model?: string;
  toolCalls?: any;
  toolCallId?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const conv = await db.select().from(conversations).where(and(eq(conversations.id, data.conversationId), eq(conversations.userId, session.user.id))).limit(1);
  if (!conv.length) throw new Error("Conversation not found");

  const [msg] = await db.insert(messages).values({
    conversationId: data.conversationId,
    role: data.role,
    content: data.content,
    model: data.model || null,
    toolCalls: data.toolCalls || null,
    toolCallId: data.toolCallId || null,
  }).returning();

  return msg;
}
