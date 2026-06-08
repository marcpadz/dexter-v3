"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/session";

export async function getUserSettings() {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      systemPrompt: true,
      favoriteModels: true,
      preferences: true,
      premium: true,
      role: true,
    },
  });
}

export async function updateUserSettings(data: Partial<{ name: string; systemPrompt: string; favoriteModels: string[]; preferences: Record<string, unknown> }>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.systemPrompt !== undefined && { systemPrompt: data.systemPrompt }),
      ...(data.favoriteModels !== undefined && { favoriteModels: data.favoriteModels }),
      ...(data.preferences !== undefined && { preferences: data.preferences }),
    },
  });
  revalidatePath("/settings");
}

export async function getApiKeys() {
  const { userId } = await auth();
  if (!userId) return [];
  return prisma.apiKey.findMany({ where: { userId } });
}

export async function saveApiKey(data: { provider: string; encryptedKey: string; iv: string; displayName?: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.apiKey.upsert({
    where: { userId_provider: { userId, provider: data.provider } },
    update: { encryptedKey: data.encryptedKey, iv: data.iv, displayName: data.displayName },
    create: { userId, provider: data.provider, encryptedKey: data.encryptedKey, iv: data.iv, displayName: data.displayName },
  });
  revalidatePath("/settings");
}

export async function deleteApiKey(provider: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await prisma.apiKey.deleteMany({ where: { userId, provider } });
  revalidatePath("/settings");
}
