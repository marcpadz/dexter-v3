import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const webSearch = tool(
  async ({ query, maxResults }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return JSON.stringify({
        error: "TAVILY_API_KEY not configured. Web search is unavailable.",
      });
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: maxResults || 5,
        }),
      });

      const data = await response.json();

      const results = (data.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      }));

      return JSON.stringify({ results });
    } catch (err: any) {
      return JSON.stringify({ error: err.message || "Search failed" });
    }
  },
  {
    name: "web_search",
    description: "Search the web for information using Tavily.",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z.number().optional().describe("Maximum number of results (default 5)"),
      conversationId: z.string().optional().describe("The current conversation ID"),
    }),
  }
);
