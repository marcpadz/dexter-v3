import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema/conversations";
import { eq } from "drizzle-orm";
import { getDaytonaClient } from "./client";
import type { Sandbox } from "@daytonaio/sdk";

let sandboxCache = new Map<string, Sandbox>();

export async function getOrCreateSandbox(conversationId: string): Promise<Sandbox> {
  const existing = sandboxCache.get(conversationId);
  if (existing) {
    try {
      await (existing as any).getWorkDir();
      console.log("[sandbox] Reusing cached sandbox:", existing.id);
      return existing;
    } catch {
      sandboxCache.delete(conversationId);
    }
  }

  const [conv] = await db
    .select({ sandboxId: conversations.sandboxId })
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  const daytona = getDaytonaClient();

  if (conv?.sandboxId) {
    try {
      const sandbox = await daytona.get(conv.sandboxId);
      const state = (sandbox as any).state;

      if (state === "started") {
        console.log("[sandbox] Reusing existing sandbox:", sandbox.id);
        sandboxCache.set(conversationId, sandbox);
        return sandbox;
      }

      if (state === "stopped") {
        console.log("[sandbox] Restarting stopped sandbox:", sandbox.id);
        await sandbox.start();
        sandboxCache.set(conversationId, sandbox);
        return sandbox;
      }

      if (state === "archived" || state === "destroying" || state === "destroyed") {
        console.log("[sandbox] Creating new sandbox (old one is", state + "):", sandbox.id);
      } else {
        try {
          await sandbox.start();
          sandboxCache.set(conversationId, sandbox);
          return sandbox;
        } catch {
          console.log("[sandbox] Failed to recover sandbox, creating new one");
        }
      }
    } catch {
      console.log("[sandbox] Could not fetch existing sandbox, creating new one");
    }
  }

  console.log("[sandbox] Creating new sandbox for conversation:", conversationId);
  const sandbox = await daytona.create({
    language: "python",
    autoStopInterval: 15,
    autoArchiveInterval: 1440,
    autoDeleteInterval: 10080,
  } as any);

  await db
    .update(conversations)
    .set({ sandboxId: sandbox.id, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // If conversationId is a CopilotKit threadId (not a DB row), the UPDATE
  // silently affects 0 rows — that's fine. The in-memory cache handles
  // sandbox reuse within the session, and auto-delete handles cleanup.
  if (conv) {
    console.log("[sandbox] Persisted sandboxId for conversation:", conversationId);
  } else {
    console.log("[sandbox] Created sandbox (no DB row for conversationId):", conversationId, "sandbox:", sandbox.id);
  }

  sandboxCache.set(conversationId, sandbox);
  return sandbox;
}

export async function stopSandbox(conversationId: string): Promise<void> {
  const sandbox = sandboxCache.get(conversationId);
  if (!sandbox) {
    const [conv] = await db
      .select({ sandboxId: conversations.sandboxId })
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conv?.sandboxId) return;

    try {
      const daytona = getDaytonaClient();
      const fetched = await daytona.get(conv.sandboxId);
      await fetched.stop();
      sandboxCache.delete(conversationId);
    } catch (err) {
      console.log("[sandbox] Error stopping sandbox:", err);
    }
    return;
  }

  try {
    await sandbox.stop();
  } catch (err) {
    console.log("[sandbox] Error stopping sandbox:", err);
  }
  sandboxCache.delete(conversationId);
}

export async function deleteSandbox(conversationId: string): Promise<void> {
  const sandbox = sandboxCache.get(conversationId);
  sandboxCache.delete(conversationId);

  if (sandbox) {
    try {
      await sandbox.delete();
    } catch (err) {
      console.log("[sandbox] Error deleting sandbox:", err);
    }
    return;
  }

  const [conv] = await db
    .select({ sandboxId: conversations.sandboxId })
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  if (!conv?.sandboxId) return;

  try {
    const daytona = getDaytonaClient();
    const fetched = await daytona.get(conv.sandboxId);
    await fetched.delete();
  } catch (err) {
    console.log("[sandbox] Error deleting sandbox:", err);
  }
}
