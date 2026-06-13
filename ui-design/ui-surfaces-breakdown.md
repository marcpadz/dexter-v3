# Dexter Agent — UI Surfaces Breakdown

> Complete inventory of every UI surface in the application, organized by page, component, and interaction pattern.
> **v2 — adds feature flags, composer toolbar, knowledgebase, MCP connectors, thinking level, attachments.**

---

## 1. Authentication Screens

### 1.1 Login Page (`/login`)
- **Type:** Full-page standalone
- **Layout:** Centered card, no sidebar/header
- **Elements:**
  - Email input field (required)
  - Password input field (required)
  - "Login" submit button
- **State:** Redirects to `/chat` on success
- **File:** `src/app/(auth)/login/page.tsx`

### 1.2 Sign-Up Page (`/sign-up`)
- **Type:** Full-page standalone
- **Layout:** Centered card, no sidebar/header
- **Elements:**
  - Name input field (required)
  - Email input field (required)
  - Password input field (required)
  - "Sign Up" submit button
- **State:** Redirects to `/chat` on success
- **File:** `src/app/(auth)/sign-up/page.tsx`

### 1.3 404 Not Found Page
- **Type:** Full-page standalone
- **Layout:** Centered content
- **Elements:**
  - Large "404" heading
  - Subtitle text
- **File:** `src/app/not-found.tsx`

---

## 2. App Shell (Authenticated Layout)

### 2.1 Root App Layout (`/`)
- **Type:** Layout wrapper
- **Wraps:** All `(app)` routes
- **Elements:**
  - CopilotKit provider (global AI context)
  - AppShell component
- **File:** `src/app/(app)/layout.tsx`

### 2.2 App Shell Component
- **Type:** Master layout
- **Architecture:** 3-column resizable panel layout (`react-resizable-panels`)
- **Elements:**
  - **Header** (top bar)
  - **Sidebar** (left panel, ~20% width, min 15%)
  - **Main Content** (center panel, dynamic ~40–60%)
  - **Workspace Panel** (right panel, toggleable, ~35% width, min 20%)
  - **Resize Handles** (draggable dividers between panels)
- **File:** `src/components/layout/app-shell.tsx`

### 2.3 Header Bar
- **Type:** Top bar (fixed, h-14)
- **Elements:**
  - **App logo/title** ("Dexter Agent") — clickable, navigates to `/`
  - **Model Selector** dropdown (GPT-4o, Claude 3.5 Sonnet, etc.)
  - **Settings** link/button → `/settings`
  - **Sign Out** button
- **File:** `src/components/layout/header.tsx`

### 2.4 Model Selector (Header Component)
- **Type:** Dropdown select
- **Elements:**
  - Trigger button showing current model
  - Dropdown grouped by provider (OpenAI, Anthropic, Google, Mistral, Groq, Ollama)
  - Each provider shows its available models
  - Dynamic: only shows providers with configured API keys
  - Loading state with spinner
  - Empty state: "No API keys configured"
- **File:** `src/components/copilot/model-selector.tsx`

---

## 3. Sidebar (Left Panel)

### 3.1 App Sidebar
- **Type:** Persistent left panel
- **Elements:**
  - **"New Chat" button** — primary CTA, full-width, creates conversation and navigates
  - **Conversation List** — scrollable area
    - Each conversation item:
      - Title text (truncated)
      - Hover state shows "Delete" button
      - Click navigates to `/chat?id={convId}`
  - **Empty State:** (when no conversations)
- **File:** `src/components/layout/app-sidebar.tsx`

---

## 4. Chat Page & Composer

### 4.1 Chat Page (`/chat`)
- **Type:** Full-height page, fills center panel
- **Elements:**
  - CopilotChat component (full height):
    - Chat title ("Dexter")
    - Message list (scrollable)
    - **Composer** (bottom area — see §4.2)
    - Initial greeting message
  - **Workspace tools registered** (frontend CopilotKit actions)
- **File:** `src/app/(app)/chat/page.tsx`

### 4.2 Composer (Chat Input Area) ← NEW
- **Type:** Rich input bar at bottom of chat
- **Layout:** Multi-row container with toolbar above textarea

  #### 4.2.1 Composer Toolbar (top row)
  - Left-side action buttons (icon buttons, each opens a popover/dropdown):
    1. **📎 Attachments** — opens file picker dropdown
       - File upload (drag & drop zone)
       - Image upload
       - Paste from clipboard
       - Attached file chips (removable)
    2. **📚 Context** — opens context dropdown with sub-sections:
       - **Projects** — list of user projects; selecting one injects its system instructions into the conversation
       - **Knowledgebase** — list of user knowledgebases; selecting one enables RAG retrieval for the conversation
         - Each KB entry: name, doc count badge, "Use" toggle
         - "Manage Knowledgebases" link → Settings → Knowledgebase tab
       - **MCP Connectors** — list of configured MCP servers with on/off toggles
         - Each connector: name, status dot (green/red), toggle switch
         - "Manage Connectors" link → Settings → MCP Servers tab
    3. **🔧 Tools** — opens feature flag toggles dropdown:
       - **Web Search** — toggle on/off (gates `web_search` tool)
       - **Browser** — toggle on/off (gates `browse_web`, `take_screenshot` tools)
       - **Terminal** — toggle on/off (gates `execute_code`, `execute_command` tools)
       - **File Explorer** — toggle on/off (gates `list_files`, `read_file`, `write_file`, `delete_file` tools)
       - **Git** — toggle on/off (gates `git_clone`, `git_status`, `git_commit` tools)
       - **Memory** — toggle on/off (gates `save_memory`, `recall_memory` tools)
       - Each toggle: label + Switch component + optional dependency warning
       - Flags stored per-conversation in `conversation.featureFlags` JSONB column
    4. **🧠 Thinking** — opens thinking level selector dropdown:
       - **None** — no chain-of-thought
       - **Low** — minimal reasoning
       - **Medium** — balanced reasoning (default)
       - **High** — deep reasoning (extended thinking / budget tokens)
       - Selection stored in `conversation.thinkingLevel` column
  - **New:** Proposed file `src/components/chat/composer-toolbar.tsx`

  #### 4.2.2 Composer Textarea
  - Multi-line auto-expanding textarea
  - Placeholder: "Ask Dexter anything..."
  - **Send button** (right side of textarea)
  - **Stop button** (replaces send during generation)
  - **New:** Proposed file `src/components/chat/composer.tsx`

---

## 5. Main Content Pages

### 5.1 Projects Page (`/projects`)
- **Type:** Page with max-width container
- **Elements:**
  - **Page Title:** "Projects" (h1)
  - **Create New Project Card:**
    - Card title: "Create New Project"
    - Description text
    - Name input (Label + Input)
    - Description input (Label + Input)
    - System Instructions textarea (Label + Textarea)
    - "Create Project" button with Plus icon
  - **Project Grid** (2 columns on md+):
    - Each project card:
      - Project name (CardTitle)
      - Delete button (ghost, red, top-right)
      - Description (CardDescription)
      - Instructions preview (line-clamp-3)
    - Empty state: "No projects yet" with border/rounded container
  - **Loading State:** Centered spinner (Loader2)
  - **Toasts:** Success/error on create/delete
- **File:** `src/app/(app)/projects/page.tsx`

### 5.2 Settings Page (`/settings`) ← UPDATED
- **Type:** Page with max-width container
- **Elements:**
  - **Page Title:** "Settings" (h1)
  - **Tab Navigation** (TabsList):
    - "API Keys" tab
    - "MCP Servers" tab ← **NOW LIVE**
    - "Knowledgebase" tab ← **NEW**
    - "Profile" tab
    - "Memory" tab ← **NOW LIVE**

  #### 5.2.1 API Keys Tab (unchanged)
  - Card with title "LLM Providers"
  - Provider configuration list per provider
  - Save / Remove buttons

  #### 5.2.2 MCP Servers Tab ← NOW LIVE
  - **"Add Connector" button** — opens dialog/sheet:
    - Name input
    - Transport type select (stdio / SSE / HTTP)
    - Command input (for stdio)
    - URL input (for SSE/HTTP)
    - Args textarea (JSON)
    - Environment variables (key-value pairs, masked values)
    - "Test Connection" button with status indicator
    - "Save" / "Cancel" buttons
  - **Connector list** — cards or rows per MCP server:
    - Server name + transport type badge
    - **Enable/Disable toggle switch** (reads/writes `mcp_servers.enabled`)
    - Status indicator (connected / disconnected / error)
    - "Edit" button → opens same dialog pre-filled
    - "Delete" destructive button
  - **Empty state:** "No MCP connectors configured. Add one to extend Dexter's capabilities."
  - **File:** `src/app/(app)/settings/page.tsx` (MCP tab content)
  - **Schema:** `src/lib/db/schema/mcp-servers.ts` (already has `enabled` column)

  #### 5.2.3 Knowledgebase Tab ← NEW
  - **"Create Knowledgebase" button** — opens dialog/sheet:
    - Name input
    - Description textarea
    - Source type select:
      - **Upload Files** — file drop zone (PDF, TXT, MD, CSV, JSON)
      - **Paste Text** — textarea for direct text entry
      - **Connect URL** — URL input for web scraping
      - **Import from Project** — project selector dropdown
    - Embedding model selector (dropdown, defaults to configured embedding provider)
    - "Create & Ingest" button
  - **Knowledgebase list** — cards per knowledgebase:
    - KB name + description
    - **Document count** badge (e.g., "12 docs")
    - **Created date**
    - **Enable/Disable toggle** (gates RAG retrieval when selected in composer)
    - **Search test** — inline search input to test retrieval quality
    - **Browse Documents** button → opens document list view
    - **Edit** button → edit name/description
    - **Delete** destructive button
  - **Document list view** (expandable within card or separate sheet):
    - Each document: name, type badge, size, uploaded date
    - "Remove" button per document
    - "Add more documents" button
  - **Empty state:** "No knowledgebases yet. Create one to give Dexter custom knowledge."
  - **Schema:** uses existing `documents` table (`src/lib/db/schema/documents.ts`) which already has `embedding` vector column + `projectId`
  - **Proposed new schema:** `knowledgebases` table (id, userId, name, description, embeddingModel, createdAt, updatedAt)
  - **File:** `src/app/(app)/settings/page.tsx` (Knowledgebase tab content)

  #### 5.2.4 Profile Tab (unchanged)
  - Card with title "Profile"
  - Form: name, image URL, "Update Profile"

  #### 5.2.5 Memory Tab ← NOW LIVE
  - **Memory list** — scrollable list of stored memories:
    - Each memory card:
      - Content text (truncated)
      - Tags (badge chips)
      - Source conversation link (if any)
      - Created date
      - "Delete" button
  - **Search bar** — search memories by content/tags
  - **"Clear All Memories"** destructive button
  - **Empty state:** "Dexter hasn't learned anything about you yet. Memories are created automatically during conversations."
  - **File:** `src/app/(app)/settings/page.tsx` (Memory tab content)

---

## 6. Workspace Panel (Right Panel)

### 6.1 Workspace Panel Container
- **Type:** Resizable right panel (toggleable)
- **Elements:**
  - Tab bar with 7 tabs (icons + labels on xl+):
    1. **Artifacts** (Code2 icon)
    2. **Browser** (Globe icon) — conditionally visible based on browser feature flag
    3. **Document** (FileText icon)
    4. **Terminal** (Terminal icon) — conditionally visible based on terminal feature flag
    5. **Files** (FolderTree icon) — conditionally visible based on file explorer feature flag
    6. **Knowledgebase** (BookOpen icon) ← **NEW TAB**
    7. **Agent Output** (Bot icon)
  - Scroll area wrapping active tab content
  - Left border separator
- **File:** `src/components/workspace/workspace-panel.tsx`

### 6.2 Artifacts Surface (unchanged)
- **File:** `src/components/workspace/surfaces/artifact-surface.tsx`

### 6.3 Browser Surface (unchanged)
- **Visibility:** gated by `featureFlags.browser` toggle in composer
- **File:** `src/components/workspace/surfaces/browser-surface.tsx`

### 6.4 Document Surface (unchanged)
- **File:** `src/components/workspace/surfaces/document-surface.tsx`

### 6.5 Terminal Surface (unchanged)
- **Visibility:** gated by `featureFlags.terminal` toggle in composer
- **File:** `src/components/workspace/surfaces/terminal-surface.tsx`

### 6.6 Files Surface (unchanged)
- **Visibility:** gated by `featureFlags.fileExplorer` toggle in composer
- **File:** `src/components/workspace/surfaces/files-surface.tsx`

### 6.7 Knowledgebase Surface ← NEW
- **Type:** Workspace tab content (read-only RAG viewer)
- **Elements:**
  - **Active knowledgebase indicator** — shows which KB(s) are active for this conversation
  - **Search input** — search the active knowledgebase(s)
  - **Search results** — ranked list of relevant document chunks:
    - Each result: content snippet (highlighted match), source document name, similarity score bar
    - Click to expand full content
  - **Source documents panel** (collapsible):
    - List of all documents in active KB(s)
    - Document name, type badge, chunk count
  - **Empty state:** "No knowledgebase selected. Use the 📚 Context menu in the composer to attach one."
  - **No results state:** "No relevant results found. Try different search terms."
- **Schema leverages:** `documents` table (existing embedding + content columns)
- **Proposed file:** `src/components/workspace/surfaces/knowledgebase-surface.tsx`

### 6.8 Agent Output Surface (unchanged)
- **File:** `src/components/workspace/surfaces/agent-output-surface.tsx`

---

## 7. Feature Flag System ← NEW

### 7.1 Architecture
- **Storage:** `conversations.featureFlags` JSONB column on the conversations table
- **Shape:**
  ```typescript
  interface FeatureFlags {
    webSearch: boolean;      // gates web_search tool
    browser: boolean;        // gates browse_web, take_screenshot tools + Browser surface
    terminal: boolean;      // gates execute_code, execute_command tools + Terminal surface
    fileExplorer: boolean;   // gates list_files, read_file, write_file, delete_file tools + Files surface
    git: boolean;            // gates git_clone, git_status, git_commit tools
    memory: boolean;         // gates save_memory, recall_memory tools
  }
  ```
- **Default:** all flags `true` (backward compatible — everything works unless explicitly disabled)
- **Runtime effect:** Flags are passed to the supervisor via `config.configurable.featureFlags`; the graph filters `allTools` to only include enabled tools before binding to the model
- **Proposed file:** `src/lib/feature-flags.ts`

### 7.2 Composer Integration
- Flags are exposed in the **🔧 Tools** dropdown in the composer toolbar (§4.2.1)
- Each flag is a Switch toggle with label text
- Changing a flag immediately updates the conversation's tool set
- Visual indicator on toggled-off tools (strikethrough or dimmed)
- **Proposed file:** `src/components/chat/feature-flag-menu.tsx`

### 7.3 Thinking Level Selector
- **Storage:** `conversations.thinkingLevel` text column (values: `'none'` | `'low'` | `'medium'` | `'high'`)
- **Default:** `'medium'`
- **Runtime effect:** Passed to model provider to configure reasoning effort / budget tokens
  - Anthropic: `thinking` parameter with `budget_tokens`
  - OpenAI: `reasoning_effort` parameter
- **Proposed file:** `src/components/chat/thinking-level-selector.tsx`

### 7.4 Thinking Level UI
- Radio button group or segmented control in dropdown:
  - **Off** — no reasoning overhead, fastest response
  - **Low** — light reasoning, good for simple tasks
  - **Medium** — balanced (default)
  - **High** — deep reasoning, slower but more thorough
- Active level shown with checkmark + description text
- **Proposed file:** `src/components/chat/thinking-level-selector.tsx`

---

## 8. Composer Context Menu (📚) ← NEW

### 8.1 Projects Sub-section
- Lists all user projects with radio-button selection
- Selected project injects its `instructions` field as a system message
- Only one project per conversation (or none)
- Shows project name + description preview

### 8.2 Knowledgebase Sub-section
- Lists all user knowledgebases with multi-select checkboxes
- Each KB shows name + document count badge
- Selected KBs enable RAG retrieval during conversation
- "Manage" link → Settings → Knowledgebase tab
- "Create New" quick-action button

### 8.3 MCP Connectors Sub-section
- Lists all configured MCP servers with toggle switches
- Each connector: name + status dot (green=connected, red=error, gray=disabled)
- Toggling enables/disables the connector's tools for this conversation
- "Manage" link → Settings → MCP Servers tab
- "Add Connector" quick-action button

---

## 9. Shared UI Components

### 9.1 Design System (shadcn/ui)
All existing components from `src/components/ui/` — unchanged.

### 9.2 New Components (Proposed)

| Component | Purpose | Proposed Path |
|-----------|---------|---------------|
| Composer | Main chat input with toolbar integration | `src/components/chat/composer.tsx` |
| ComposerToolbar | Icon buttons row (Attachments, Context, Tools, Thinking) | `src/components/chat/composer-toolbar.tsx` |
| AttachmentMenu | File upload popover | `src/components/chat/attachment-menu.tsx` |
| ContextMenu | Projects + Knowledgebase + MCP selector | `src/components/chat/context-menu.tsx` |
| FeatureFlagMenu | Per-conversation tool toggles | `src/components/chat/feature-flag-menu.tsx` |
| ThinkingLevelSelector | Reasoning effort selector | `src/components/chat/thinking-level-selector.tsx` |
| McpConnectorCard | MCP server card in settings | `src/components/settings/mcp-connector-card.tsx` |
| McpConnectorDialog | Add/edit MCP server dialog | `src/components/settings/mcp-connector-dialog.tsx` |
| KnowledgebaseCard | KB card in settings | `src/components/settings/knowledgebase-card.tsx` |
| KnowledgebaseDialog | Create/edit KB dialog | `src/components/settings/knowledgebase-dialog.tsx` |
| KnowledgebaseSurface | Workspace KB viewer tab | `src/components/workspace/surfaces/knowledgebase-surface.tsx` |
| MemoryCard | Memory item in settings | `src/components/settings/memory-card.tsx` |

---

## 10. Toast/Notification Surfaces (unchanged)

### 10.1 Sonner Toasts
- **Trigger:** Various actions (project CRUD, API key CRUD, profile update, feature flag changes, connector add/remove, KB create/delete)
- **Types:** `toast.success()`, `toast.error()`
- **File:** `src/components/ui/sonner.tsx`

---

## 11. Navigation Map

```
/login                → Login page (unauthenticated)
/sign-up              → Sign-up page (unauthenticated)
/                     → Redirects to /chat
/chat                 → Chat page (authenticated)
/chat?id={convId}     → Chat page with specific conversation
/projects             → Projects management (authenticated)
/settings             → Settings (authenticated)
/settings?tab=api-keys         → Settings → API Keys
/settings?tab=mcp-servers       → Settings → MCP Servers
/settings?tab=knowledgebase     → Settings → Knowledgebase ← NEW
/settings?tab=profile           → Settings → Profile
/settings?tab=memory             → Settings → Memory
/404                  → Not found page
```

---

## 12. Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER BAR (h-14)                                               │
│  [Logo]          [Model ▼]  [⚙️ Settings]  [Sign Out]            │
├──────────┬──────────────────────────┬────────────────────────────┤
│          │                          │                            │
│ SIDEBAR  │    CHAT / MAIN CONTENT   │   WORKSPACE PANEL          │
│ (20%)    │    (40-60%)              │   (35%, toggleable)        │
│          │                          │                            │
│ [+ New]  │  ┌─────────────────────┐ │  [Artifacts] [Browser]    │
│          │  │  Message List       │ │  [Document] [Terminal]    │
│ ──────── │  │                     │ │  [Files] [📚 KB] [Agent]  │
│ Chat 1 ◀ │  │  ...                │ │                            │
│ Chat 2   │  │                     │ │  ┌──────────────────┐    │
│ Chat 3   │  └─────────────────────┘ │  │ Active tab        │    │
│          │                          │  │ content           │    │
│          │  ┌─────────────────────┐ │  │                    │    │
│          │  │ COMPOSER           │ │  │                    │    │
│          │  │ [📎][📚][🔧][🧠]  │ │  └──────────────────┘    │
│          │  │ [  Textarea    → ] │ │                            │
│          │  └─────────────────────┘ │                            │
│          │                          │                            │
│          │  ↕ resize handle         │  ↕ resize handle           │
└──────────┴──────────────────────────┴────────────────────────────┘
```

### Composer Toolbar Expanded:

```
┌──────────────────────────────────────────────┐
│  [📎 Attach] [📚 Context ▾] [🔧 Tools ▾] [🧠 Thinking ▾]  │
│  ┌──────────────────────────────────────┐   │
│  │ Ask Dexter anything...               │   │
│  │                                      │ [→]│
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘

  📎 Attach ▾                  📚 Context ▾                 🔧 Tools ▾
┌─────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│ 📄 File     │    │ Projects                  │    │ ☑ Web Search            │
│ 🖼️ Image    │    │ ◉ API Sandbox             │    │ ☑ Browser               │
│ 📋 Paste    │    │ ○ Frontend App            │    │ ☑ Terminal              │
│             │    │ ○ ML Research             │    │ ☑ File Explorer         │
│ Drop zone   │    │                           │    │ ☑ Git                   │
│ ┌─────────┐ │    │ Knowledgebase             │    │ ☑ Memory                │
│ │ or drag  │ │    │ ☑ API Docs (12 docs)      │    │                          │
│ └─────────┘ │    │ ☐ Internal Wiki (5 docs)   │    │                          │
│             │    │                           │    │                          │
│             │    │ MCP Connectors             │    └──────────────────────────┘
│             │    │ 🔵 Tavily Search  [ON ]     │
│             │    │ 🔴 Slack         [   ]      │
│             │    │ ⚪ GitHub        [   ]      │
│             │    │                           │
│             │    │ [+ Add Connector]          │
│             │    │ [⚙️ Manage]                 │
│             │    └──────────────────────────┘
└─────────────┘

                                                               🧠 Thinking ▾
                                                    ┌──────────────────────────┐
                                                    │ ○ Off   No reasoning     │
                                                    │ ○ Low   Quick answers    │
                                                    │ ● Medium  Balanced       │
                                                    │ ○ High  Deep analysis    │
                                                    └──────────────────────────┘
```

---

## 13. Interaction Patterns

### 13.1 Agent-to-Workspace Communication (unchanged)
### 13.2 Resizable Panels (unchanged)
### 13.3 Toast Notifications (unchanged)

### 13.4 Feature Flag → Runtime Pipeline ← NEW
1. User toggles a flag in composer 🔧 Tools dropdown
2. Flag value saved to `conversation.featureFlags` JSONB
3. On next message, CopilotKit passes flags via `configurable.featureFlags`
4. Graph filters `allTools` array: removes tools belonging to disabled flags
5. Supervisor binds only filtered tools to the model
6. Workspace panel hides tabs for disabled features (e.g., Browser tab hidden if `browser: false`)

### 13.5 Thinking Level → Model Config ← NEW
1. User selects thinking level in 🧠 dropdown
2. Value saved to `conversation.thinkingLevel`
3. Model provider configures reasoning:
   - Anthropic: `thinking: { type: 'enabled', budget_tokens: N }`
   - OpenAI: `reasoning_effort: 'low' | 'medium' | 'high'`
   - Others: system prompt instruction adjustment

### 13.6 Knowledgebase → RAG Pipeline ← NEW
1. User selects KB(s) in 📚 Context → Knowledgebase section
2. Selected KB IDs stored in `conversation.knowledgebaseIds` array
3. On each user message, runtime retrieves relevant chunks via cosine similarity
4. Chunks injected as context in supervisor's system prompt
5. Knowledgebase surface in workspace shows live retrieval results

### 13.7 MCP Connector → Tool Injection ← NEW
1. User toggles connector in 📚 Context → MCP Connectors section
2. Enabled connector IDs passed to runtime
3. Runtime calls MCP server's `tools/list` to discover available tools
4. Discovered tools injected into the graph's tool node alongside built-in tools
5. Connector status polling shows live health in the context menu

---

## 14. Data Models (UI-Relevant) ← UPDATED

| Model | UI Location | Status |
|-------|-------------|--------|
| Conversation | Sidebar, Chat page | Existing — **add `featureFlags`, `thinkingLevel`, `knowledgebaseIds`** |
| Message | Chat page message list | Existing |
| Project | Projects page, Context menu | Existing |
| Document | Settings → Knowledgebase tab, KB surface | Existing schema — **now used for KB docs** |
| Artifact | Workspace → Artifacts surface | Existing |
| ApiKey | Settings → API Keys tab | Existing |
| McpServer | Settings → MCP tab, Context menu | Existing schema — **now has full UI** |
| Memory | Settings → Memory tab | Existing schema — **now has full UI** |
| **Knowledgebase** | Settings → KB tab, Context menu, KB surface | **NEW table** |
| WorkspaceFile | Workspace → Files surface | Existing |
| WorkspaceActivity | Internal activity log | Existing |

### Proposed Schema Changes

```sql
-- Add to conversations table
ALTER TABLE conversations ADD COLUMN "featureFlags" JSONB DEFAULT '{"webSearch":true,"browser":true,"terminal":true,"fileExplorer":true,"git":true,"memory":true}';
ALTER TABLE conversations ADD COLUMN "thinkingLevel" TEXT DEFAULT 'medium';
ALTER TABLE conversations ADD COLUMN "knowledgebaseIds" UUID[] DEFAULT '{}';

-- New knowledgebases table
CREATE TABLE knowledgebases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "embeddingModel" TEXT DEFAULT 'openai/text-embedding-3-small',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Update documents table to reference knowledgebase
ALTER TABLE documents ADD COLUMN "knowledgebaseId" UUID REFERENCES knowledgebases(id) ON DELETE SET NULL;
```

---

## 15. DB Schema Supporting KB (Already Exists)

The `documents` table in `src/lib/db/schema/documents.ts` already has:
- `embedding` — `vector(1536)` column via pgvector
- `content` — document text
- `type` — document type discriminator
- `metadata` — JSONB for flexible metadata
- `projectId` — optional project association

This means the knowledgebase surface can query documents by `knowledgebaseId` with cosine similarity without any migration to the documents table itself — only the new `knowledgebases` parent table + FK are needed.

---

*Generated: 2026-06-14 (v2)*
*Source: dexter-v3/src/*
