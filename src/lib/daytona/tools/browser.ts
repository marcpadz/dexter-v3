import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getOrCreateSandbox } from "@/lib/daytona/sandbox-manager";

export const browseWeb = tool(
  async ({ url, action, x, y, text, conversationId }) => {
    try {
      const sandbox = await getOrCreateSandbox(conversationId) as any;

      // Start computer use session
      if (typeof sandbox.computerUse?.start === "function") {
        await sandbox.computerUse.start();
      }

      if (action === "screenshot" || !action) {
        // Navigate + screenshot
        if (url) {
          if (sandbox.computerUse?.keyboard?.type) {
            await sandbox.computerUse.keyboard.type(url);
            await sandbox.computerUse.keyboard.press("Enter");
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } else {
            await sandbox.process.executeCommand(`chromium-browser --headless --screenshot=/tmp/screenshot.png --no-sandbox "${url}" 2>/dev/null; cat /tmp/screenshot.png | base64 -w0`);
          }
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
          url: url || "",
          screenshot_base64: base64 ? `data:image/jpeg;base64,${base64}` : "",
        });
      }

      if (action === "click" && sandbox.computerUse?.mouse) {
        await sandbox.computerUse.mouse.move(x ?? 500, y ?? 500);
        await sandbox.computerUse.mouse.click();
        return JSON.stringify({ action: "click", x: x ?? 500, y: y ?? 500 });
      }

      if (action === "type" && sandbox.computerUse?.keyboard) {
        await sandbox.computerUse.keyboard.type(text || "");
        return JSON.stringify({ action: "type", text: text || "" });
      }

      if (action === "scroll" && sandbox.computerUse?.mouse) {
        await sandbox.computerUse.mouse.scroll(x ?? 0, y ?? 500);
        return JSON.stringify({ action: "scroll", x: x ?? 0, y: y ?? 500 });
      }

      return JSON.stringify({ error: `Unknown action: ${action}` });
    } catch (err: any) {
      return JSON.stringify({
        url: url || "",
        error: err.message || "Browser action failed",
      });
    }
  },
  {
    name: "browse_web",
    description: "Open a URL in the sandbox browser and take a screenshot. Supports click, type, scroll actions.",
    schema: z.object({
      url: z.string().describe("The URL to browse (required for screenshot action)"),
      action: z.enum(["screenshot", "click", "type", "scroll"]).optional().describe("The action to perform (default: screenshot)"),
      x: z.number().optional().describe("X coordinate for click/scroll"),
      y: z.number().optional().describe("Y coordinate for click/scroll"),
      text: z.string().optional().describe("Text to type for type action"),
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
