# Quickstart: Daytona Sandbox Integration

**Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)

## Prerequisites

- Node.js 22+
- Neon PostgreSQL database with `DATABASE_URL` set
- Daytona.io account with API key
- (Optional) Tavily API key for web search

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env
# Edit .env and add:
#   DAYTONA_API_KEY=your-key
#   DAYTONA_API_URL=https://app.daytona.io/api  # or self-hosted
#   DAYTONA_TARGET=us                            # optional
#   TAVILY_API_KEY=your-key                      # optional, for web search
#   DATABASE_URL=postgres://...
#   BETTER_AUTH_SECRET=...

# 3. Apply database migrations
npx drizzle-kit push

# 4. Clean up AppleDouble files
find . -name '._*' -delete
```

## Validation Scenarios

### V1: Code Execution (P1)

**Prereqs**: Auth disabled or user logged in

1. Start dev server: `npm run dev`
2. Navigate to `/chat`
3. Type: "Run this Python code: `print('Hello from Daytona!')`"
4. **Expected**: Response shows "Hello from Daytona!" in chat. Workspace terminal panel opens with the output.

### V2: File Operations (P2)

1. In the same chat session, type: "Create a file called `hello.py` with the content `print('hello')`"
2. **Expected**: Agent writes file via Daytona FS API. Workspace files panel shows the file.
3. Type: "Read the file `hello.py`"
4. **Expected**: Agent reads file content. Content displayed in chat and/or files surface.

### V3: Browser Screenshot (P2)

1. Type: "Take a screenshot of google.com"
2. **Expected**: Agent starts computer use, navigates to URL, takes screenshot. Workspace browser panel displays the screenshot.

### V4: Terminal Session (P2)

1. Type: "Create a terminal session and run `ls -la` then `pwd`"
2. **Expected**: Agent creates a persistent session, runs both commands. Terminal surface shows sequential output with state preserved between commands.

### V5: Sandbox Reuse (P3)

1. After V1 succeeds, type another code execution request
2. **Expected**: Same sandbox ID is reused (check server logs — no "Creating new sandbox" message)

### V6: Python Service Removed (SC-004)

1. Verify `services/agent/` directory does not exist
2. Verify `package.json` does not contain `next-auth`, `@auth/prisma-adapter`, `@prisma/client`, `prisma`
3. Verify `npm run build` succeeds
4. **Expected**: Build passes, no Python dependencies, no separate service needed

## Architecture Verification

After setup, verify the data flow:

```
<CopilotChat> → /api/copilotkit → CopilotRuntime → LangGraphAgent
  → LangGraph.js graph → Daytona tool → @daytonaio/sdk → Daytona.io sandbox
  → Tool result → AG-UI stream → useCopilotAction → Workspace store → UI update
```

Check server logs for:
- "Creating new sandbox" on first tool call
- "Reusing sandbox" on subsequent calls
- No "Agent returned" fallback messages (that's the old chat-adapter)
