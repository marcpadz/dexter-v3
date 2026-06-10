/**
 * Chat adapter — sends messages to the Python LangGraph agent service.
 * Falls back to a local echo when the agent isn't running.
 */

const AGENT_URL = (process.env.NEXT_PUBLIC_AGENT_SERVICE_URL || "http://localhost:8000") + "/api/agent";

export async function sendChatMessage(message: string): Promise<string> {
  try {
    const response = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Agent returned ${response.status}`);
    }

    // Handle streaming or plain JSON response
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      const text = await response.text();
      // Extract content from SSE stream
      const content = text
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => {
          try {
            const parsed = JSON.parse(line.slice(6));
            return parsed.content || parsed.text || "";
          } catch {
            return "";
          }
        })
        .join("");
      return content || "Agent returned an empty response.";
    }

    const data = await response.json();
    return data.content || data.response || data.message || "Done.";
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      // Agent service not running — use local echo
      return `[Local fallback] The agent service isn't running yet. You said: "${message}"\n\nStart the agent with:\n\`\`\`\ncd services/agent && source .venv/bin/activate && uvicorn app.main:app --port 8000 --reload\n\`\`\`\n\nOnce running, messages will flow through the LangGraph backend.`;
    }
    throw error;
  }
}
