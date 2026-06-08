import { streamText, convertToModelMessages, UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createGroq } from "@ai-sdk/groq";
import { createXai } from "@ai-sdk/xai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { prisma } from "@/lib/db";

function resolveProvider(modelId: string, apiKey?: string) {
  const [providerPrefix, ...rest] = modelId.split("/");
  const actualModelId = rest.join("/") || modelId;
  const key = apiKey || process.env.OPENAI_API_KEY;

  switch (providerPrefix) {
    case "openai":
      return createOpenAI({ apiKey: key })(actualModelId);
    case "anthropic":
      return createAnthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY })(actualModelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey: apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY })(actualModelId);
    case "mistral":
      return createMistral({ apiKey: apiKey || process.env.MISTRAL_API_KEY })(actualModelId);
    case "groq":
      return createGroq({ apiKey: apiKey || process.env.GROQ_API_KEY })(actualModelId);
    case "xai":
      return createXai({ apiKey: apiKey || process.env.XAI_API_KEY })(actualModelId);
    case "deepseek":
      return createDeepSeek({ apiKey: apiKey || process.env.DEEPSEEK_API_KEY })(actualModelId);
    case "openrouter":
      return createOpenRouter({ apiKey: apiKey || process.env.OPENROUTER_API_KEY })(actualModelId);
    case "ollama":
      return createOpenAICompatible({
        name: "ollama",
        baseURL: process.env.OLLAMA_BASE_URL,
      })(actualModelId);
    default:
      return createOpenRouter({ apiKey: apiKey || process.env.OPENROUTER_API_KEY })(modelId);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { messages, model, conversationId, systemPrompt, knowledgeBaseIds, projectId } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  const userKey = await prisma.apiKey.findUnique({
    where: { userId_provider: { userId, provider: model.split("/")[0] || "openrouter" } },
  });

  let system = systemPrompt || "";
  const appConfig = await prisma.appConfig.findUnique({ where: { key: "default" } });
  if (appConfig?.systemPrompt) {
    system = appConfig.systemPrompt + "\n" + system;
  }

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project?.instructions) {
      system += "\n" + project.instructions;
    }
  }

  if (knowledgeBaseIds?.length) {
    const kbs = await prisma.knowledgeBase.findMany({
      where: { id: { in: knowledgeBaseIds }, userId },
      include: { chunks: { take: 10 } },
    });
    const context = kbs
      .flatMap((kb) => kb.chunks.map((c) => c.chunkText))
      .join("\n---\n");
    if (context) {
      system += "\n\nRelevant context:\n" + context;
    }
  }

  const modelInstance = resolveProvider(model, userKey?.encryptedKey);
  const modelMessages = convertToModelMessages(messages as UIMessage[]);

  const result = streamText({
    model: modelInstance,
    system: system || undefined,
    messages: modelMessages,
  });

  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage.role === "user" && conversationId) {
    prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content: typeof lastUserMessage.content === "string" ? lastUserMessage.content : JSON.stringify(lastUserMessage.content),
        model,
      },
    }).catch(() => {});
  }

  return result.toDataStreamResponse();
}
