import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "../..");

/**
 * Read LangGraph tool names from the barrel export file.
 * These are defined in tool(...) calls with a name property.
 */
function getLangGraphToolNames(): string[] {
  const src = readFileSync(
    join(projectRoot, "src/lib/daytona/tools/index.ts"),
    "utf-8"
  );
  // Read the tool definition files to extract the actual `name: "..."` values
  const toolFiles = [
    "execute-code.ts",
    "execute-command.ts",
    "filesystem.ts",
    "git.ts",
    "browser.ts",
    "search.ts",
  ];

  const names: string[] = [];
  for (const file of toolFiles) {
    const content = readFileSync(
      join(projectRoot, "src/lib/daytona/tools", file),
      "utf-8"
    );
    const matches = content.matchAll(/name:\s*"([^"]+)"/g);
    for (const m of matches) {
      names.push(m[1]);
    }
  }

  // Add memory tools from the agent tools directory
  const memoryContent = readFileSync(
    join(projectRoot, "src/lib/agent/tools/memory.ts"),
    "utf-8"
  );
  const memoryMatches = memoryContent.matchAll(/name:\s*"([^"]+)"/g);
  for (const m of memoryMatches) {
    names.push(m[1]);
  }

  return [...new Set(names)].sort();
}

/**
 * Read frontend useCopilotAction names from frontend-tools.ts.
 */
function getFrontendActionNames(): string[] {
  const src = readFileSync(
    join(projectRoot, "src/components/copilot/frontend-tools.ts"),
    "utf-8"
  );
  const names: string[] = [];
  // Find each useCopilotAction block and extract the first name field
  const blockStarts = [...src.matchAll(/useCopilotAction\(\{/g)]
    .map((m) => m.index!);
  for (const start of blockStarts) {
    // Find the first name: "..." within this block
    const block = src.slice(start, start + 500); // plenty for the block header
    const nameMatch = block.match(/name:\s*"([^"]+)"/);
    if (nameMatch) names.push(nameMatch[1]);
  }
  return [...new Set(names)].sort();
}

describe("frontend tool registration parity", () => {
  const toolNames = getLangGraphToolNames();
  const actionNames = getFrontendActionNames();

  it("should have a frontend action for every LangGraph tool (except chat-only)", () => {
    // Tools that return chat-only results need no frontend action
    const chatOnly = ["execute_command", "recall_memory", "save_memory"];
    // Every tool that returns structured data needs a frontend action
    // for the AG-UI bridge to route results correctly
    const missing = toolNames.filter((t) => !actionNames.includes(t) && !chatOnly.includes(t));
    if (missing.length > 0) {
      console.log("Tool names:", toolNames);
      console.log("Action names:", actionNames);
      console.log("Missing frontend actions for:", missing);
    }
    expect(missing).toEqual([]);
  });

  it("should not have orphan frontend actions (no matching tool)", () => {
    // Frontend-only actions (create_artifact, update_artifact, create_document)
    // do not need matching server-side tools — they are client-only.
    const frontendOnly = ["create_artifact", "update_artifact", "create_document"];
    const orphan = actionNames.filter(
      (a) => !toolNames.includes(a) && !frontendOnly.includes(a)
    );
    expect(orphan).toEqual([]);
  });
});
