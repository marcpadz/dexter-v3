import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrCreateSandbox } from "@/lib/daytona/sandbox-manager";

export const browseUrl = tool(
  async ({ url, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId) as any;

      if (typeof sandbox.computerUse?.start === "function") {
        await sandbox.computerUse.start();
      }
      if (sandbox.computerUse?.keyboard?.type) {
        await sandbox.computerUse.keyboard.type(url);
        await sandbox.computerUse.keyboard.press("Enter");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        await sandbox.process.executeCommand(`chromium-browser --headless --screenshot=/tmp/screenshot.png --no-sandbox "${url}" 2>/dev/null; cat /tmp/screenshot.png | base64 -w0`);
      }

      let screenshot: any;
      try {
        screenshot = await sandbox.computerUse?.screenshot?.takeCompressed?.();
      } catch {
        screenshot = null;
      }

      const base64 =
        typeof screenshot === "string"
          ? screenshot
          : screenshot
            ? Buffer.from(screenshot instanceof Uint8Array ? screenshot : (screenshot as any).data || screenshot).toString("base64")
            : "";

      return JSON.stringify({
        url,
        screenshot_base64: base64 ? `data:image/jpeg;base64,${base64}` : "",
      });
    } catch (err: any) {
      return JSON.stringify({
        url,
        error: err.message || "Browser navigation failed",
      });
    }
  },
  {
    name: "browse_url",
    description: "Open a URL in the sandbox browser and take a screenshot.",
    schema: z.object({
      url: z.string().describe("The URL to browse"),
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);

export const takeScreenshot = tool(
  async ({ conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId) as any;
      let screenshot: any;
      try {
        screenshot = await sandbox.computerUse?.screenshot?.takeCompressed?.();
      } catch {
        return JSON.stringify({ error: "Screenshot not available" });
      }

      const base64 =
        typeof screenshot === "string"
          ? screenshot
          : screenshot
            ? Buffer.from(screenshot instanceof Uint8Array ? screenshot : (screenshot as any).data || screenshot).toString("base64")
            : "";

      return JSON.stringify({
        screenshot: base64 ? `data:image/jpeg;base64,${base64}` : "",
      });
    } catch (err: any) {
      return JSON.stringify({ error: err.message || "Screenshot failed" });
    }
  },
  {
    name: "take_screenshot",
    description: "Take a screenshot of the current sandbox browser state.",
    schema: z.object({
      conversationId: z.string().describe("The current conversation ID"),
    }),
  }
);
