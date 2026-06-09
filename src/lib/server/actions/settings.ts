"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { apiKeys } from "@/lib/db/schema/api-keys";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function getUserSettings() {
  const user = await getSession();
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  return result[0] ?? null;
}

export async function updateUserSettings(data: {
  name?: string;
}) {
  const user = await getSession();
  await db
    .update(users)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  revalidatePath("/settings");
}

export async function getApiKeys() {
  const user = await getSession();
  return db
    .select({
      id: apiKeys.id,
      provider: apiKeys.provider,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id));
}

export async function saveApiKey(data: {
  provider: string;
  encryptedKey: string;
  iv: string;
}) {
  const user = await getSession();
  // Delete existing key for this provider then insert new one
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.userId, user.id), eq(apiKeys.provider, data.provider)));
  await db.insert(apiKeys).values({
    userId: user.id,
    provider: data.provider,
    encryptedKey: data.encryptedKey,
    iv: data.iv,
  });
  revalidatePath("/settings");
}

export async function deleteApiKey(provider: string) {
  const user = await getSession();
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.userId, user.id), eq(apiKeys.provider, provider)));
  revalidatePath("/settings");
}
