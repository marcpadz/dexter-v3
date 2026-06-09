"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users, apiKeys } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import { encryptKey, decryptKey } from "@/lib/auth/crypto";

export async function getUserSettings() {
  const session = await requireAuth();
  const userId = session.user.id;

  const user = await db.select().from(users).where(eq(users.id, userId));
  return user[0] || null;
}

export async function updateProfile(data: { name?: string; image?: string }) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db.update(users)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.image !== undefined && { image: data.image }),
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

  revalidatePath("/settings");
}

export async function getApiKeys() {
  const session = await requireAuth();
  const userId = session.user.id;

  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

  // Decrypt the keys before returning them to the frontend
  return keys.map(k => {
    try {
      const decrypted = decryptKey(k.encryptedKey, k.iv);
      return {
        ...k,
        decryptedKey: decrypted
      };
    } catch (e) {
      console.error(`Failed to decrypt key for provider ${k.provider}`);
      return {
        ...k,
        decryptedKey: ""
      };
    }
  });
}

export async function saveApiKey(provider: string, key: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const { encryptedKey, iv } = encryptKey(key);

  const existing = await db.select().from(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)));

  if (existing.length > 0) {
    await db.update(apiKeys)
      .set({ encryptedKey, iv })
      .where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)));
  } else {
    await db.insert(apiKeys).values({
      userId,
      provider,
      encryptedKey,
      iv
    });
  }

  revalidatePath("/settings");
}

export async function deleteApiKey(provider: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db.delete(apiKeys).where(and(eq(apiKeys.userId, userId), eq(apiKeys.provider, provider)));
  revalidatePath("/settings");
}

import { memories } from "@/lib/db/schema";

export async function getMemories() {
  const session = await requireAuth();
  const userId = session.user.id;

  // We don't select the embedding vector as it's large and not needed in UI
  const rows = await db.select({
    id: memories.id,
    content: memories.content,
    tags: memories.tags,
    createdAt: memories.createdAt,
  }).from(memories).where(eq(memories.userId, userId));

  return rows;
}

export async function deleteMemory(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db.delete(memories).where(and(eq(memories.id, id), eq(memories.userId, userId)));
  revalidatePath("/settings");
}

import { mcpServers } from "@/lib/db/schema";

export async function getMcpServers() {
  const session = await requireAuth();
  const userId = session.user.id;

  return db.select().from(mcpServers).where(eq(mcpServers.userId, userId));
}

export async function saveMcpServer(data: { id?: string; name: string; transportType: string; command?: string; url?: string; args?: any; env?: any; enabled?: boolean }) {
  const session = await requireAuth();
  const userId = session.user.id;

  if (data.id) {
    await db.update(mcpServers)
      .set({
        name: data.name,
        transportType: data.transportType,
        command: data.command,
        url: data.url,
        args: data.args,
        env: data.env,
        enabled: data.enabled ?? true
      })
      .where(and(eq(mcpServers.id, data.id), eq(mcpServers.userId, userId)));
  } else {
    await db.insert(mcpServers).values({
      userId,
      name: data.name,
      transportType: data.transportType,
      command: data.command,
      url: data.url,
      args: data.args,
      env: data.env,
      enabled: data.enabled ?? true
    });
  }
  revalidatePath("/settings");
}

export async function toggleMcpServer(id: string, enabled: boolean) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db.update(mcpServers)
    .set({ enabled })
    .where(and(eq(mcpServers.id, id), eq(mcpServers.userId, userId)));
  revalidatePath("/settings");
}

export async function deleteMcpServer(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db.delete(mcpServers).where(and(eq(mcpServers.id, id), eq(mcpServers.userId, userId)));
  revalidatePath("/settings");
}
