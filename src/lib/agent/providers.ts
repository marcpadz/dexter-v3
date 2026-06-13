import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export function resolveModel(model: string, apiKeys: Record<string, string>): BaseChatModel {
  const [provider, ...rest] = model.split("/");
  const modelName = rest.join("/");

  switch (provider) {
    case "anthropic": {
      const apiKey = apiKeys["anthropic"] || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("No Anthropic API key configured");
      return new ChatAnthropic({
        model: modelName || "claude-sonnet-4-20250514",
        apiKey,
      });
    }
    case "openai": {
      const apiKey = apiKeys["openai"] || process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("No OpenAI API key configured");
      return new ChatOpenAI({
        model: modelName || "gpt-4o",
        apiKey,
      });
    }
    case "groq": {
      const apiKey = apiKeys["groq"] || process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("No Groq API key configured");
      return new ChatOpenAI({
        model: modelName || "llama-3.3-70b-versatile",
        apiKey,
        configuration: { baseURL: "https://api.groq.com/openai/v1" },
      });
    }
    case "google": {
      const apiKey = apiKeys["google"] || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new Error("No Google API key configured");
      return new ChatOpenAI({
        model: modelName || "gemini-2.0-flash",
        apiKey,
        configuration: { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" },
      });
    }
    case "mistral": {
      const apiKey = apiKeys["mistral"] || process.env.MISTRAL_API_KEY;
      if (!apiKey) throw new Error("No Mistral API key configured");
      return new ChatOpenAI({
        model: modelName || "mistral-large-latest",
        apiKey,
        configuration: { baseURL: "https://api.mistral.ai/v1" },
      });
    }
    case "openrouter": {
      const apiKey = apiKeys["openrouter"] || process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("No OpenRouter API key configured");
      return new ChatOpenAI({
        model: modelName || "openai/gpt-4o",
        apiKey,
        configuration: { baseURL: "https://openrouter.ai/api/v1" },
      });
    }
    default: {
      const apiKey = apiKeys[provider] || process.env.OPENAI_API_KEY;
      return new ChatOpenAI({ model: modelName || model, apiKey });
    }
  }
}
