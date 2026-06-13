"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema/conversations";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { deleteSandbox } from "@/lib/daytona/sandbox-manager";

export async function getConversations() {
  const session = await getSession();
  if (!session) return [];
  return db.select().from(conversations).where(eq(conversations.userId, session.user.id)).orderBy(desc(conversations.updatedAt));
}

export async function createConversation(data: { title?: string; model?: string; projectId?: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const [conv] = await db.insert(conversations).values({
    userId: session.user.id,
    title: data.title || "New Chat",
    model: data.model || null,
    projectId: data.projectId || null,
  }).returning();

  revalidatePath("/chat");
  return conv;
}

export async function updateConversation(id: string, data: Partial<{ title: string; model: string; pinned: boolean; projectId: string }>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const [conv] = await db.update(conversations).set({ ...data, updatedAt: new Date() }).where(eq(conversations.id, id)).returning();

  revalidatePath("/chat");
  return conv;
}

export async function deleteConversation(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await deleteSandbox(id);
  } catch (err) {
    console.log("[conversations] Error cleaning up sandbox on delete:", err);
  }

  await db.delete(conversations).where(eq(conversations.id, id));
  revalidatePath("/chat");
}
