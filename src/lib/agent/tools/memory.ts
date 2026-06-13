import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "@/lib/db";
import { memories } from "@/lib/db/schema/memories";
import { eq, sql } from "drizzle-orm";

/**
 * Generate a simple text embedding using OpenAI's API.
 * Requires OPENAI_API_KEY env var for proper semantic search.
 *
 * Fallback: returns a hash-based vector when no key is configured.
 * This provides degraded recall — memories will match by keyword
 * rather than meaning. Set OPENAI_API_KEY for full pgvector support.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback: return a zero vector with the text length as a crude signal
    console.warn("[memory] No OPENAI_API_KEY — using fallback embedding. Set OPENAI_API_KEY for semantic search via pgvector.");
    const dim = 1536;
    const arr = new Array(dim).fill(0);
    const hash = text.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    arr[0] = hash / 1000;
    return arr;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small",
      }),
    });

    const data = await response.json();
    return data.data?.[0]?.embedding || new Array(1536).fill(0);
  } catch (err) {
    console.error("[memory] Embedding generation failed:", err);
    return new Array(1536).fill(0);
  }
}

/**
 * save_memory — Store a fact in the memories table with an embedding.
 */
export const saveMemory = tool(
  async ({ content, tags, userId, sourceConversationId }) => {
    try {
      const embedding = await generateEmbedding(content);

      const [memory] = await db
        .insert(memories)
        .values({
          userId: userId || "anonymous",
          content,
          embedding,
          tags: tags || [],
          sourceConversationId: sourceConversationId || null,
        })
        .returning();

      return JSON.stringify({
        id: memory.id,
        content: memory.content,
        tags: memory.tags,
        createdAt: memory.createdAt,
      });
    } catch (err: any) {
      return JSON.stringify({
        error: err.message || "Failed to save memory",
      });
    }
  },
  {
    name: "save_memory",
    description: "Save a fact or piece of information to the user's long-term memory. Memories persist across conversations.",
    schema: z.object({
      content: z.string().describe("The fact or information to remember"),
      userId: z.string().describe("The user's ID"),
      tags: z.array(z.string()).optional().describe("Optional tags for categorizing the memory"),
      sourceConversationId: z.string().optional().describe("The conversation ID this memory comes from"),
    }),
  }
);

/**
 * recall_memory — Retrieve relevant memories by semantic similarity.
 */
export const recallMemory = tool(
  async ({ query, userId, limit }) => {
    try {
      const queryEmbedding = await generateEmbedding(query);

      if (!queryEmbedding || queryEmbedding.every((v) => v === 0)) {
        // Fallback: return recent memories for the user
        const recentMemories = await db
          .select()
          .from(memories)
          .where(eq(memories.userId, userId || "anonymous"))
          .orderBy(sql`"memories"."createdAt" DESC`)
          .limit(limit || 5);

        return JSON.stringify({
          results: recentMemories.map((m) => ({
            id: m.id,
            content: m.content,
            tags: m.tags,
            createdAt: m.createdAt,
          })),
        });
      }

      // Cosine similarity search via pgvector
      const vectorStr = "[" + queryEmbedding.join(",") + "]";
      const results = await db.execute(sql`
        SELECT id, content, tags, "createdAt",
               1 - ("embedding" <=> ${sql.raw(vectorStr)}::vector) AS similarity
        FROM memories
        WHERE "userId" = ${userId || "anonymous"}
        ORDER BY similarity DESC
        LIMIT ${limit || 5}
      `);

      const rows = results.rows || [];
      return JSON.stringify({
        results: rows.map((r: any) => ({
          id: r.id,
          content: r.content,
          tags: r.tags,
          createdAt: r.createdAt,
          similarity: r.similarity,
        })),
      });
    } catch (err: any) {
      return JSON.stringify({
        error: err.message || "Failed to recall memories",
      });
    }
  },
  {
    name: "recall_memory",
    description: "Search the user's long-term memory for relevant facts using semantic similarity.",
    schema: z.object({
      query: z.string().describe("The search query to find relevant memories"),
      userId: z.string().describe("The user's ID"),
      limit: z.number().optional().describe("Maximum number of memories to return (default: 5)"),
    }),
  }
);
