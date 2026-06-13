# Graph Report - .  (2026-06-13)

## Corpus Check
- 260 files · ~183,054 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1276 nodes · 1902 edges · 115 communities (85 shown, 30 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend UI Components|Frontend UI Components]]
- [[_COMMUNITY_Dependencies & Package Config|Dependencies & Package Config]]
- [[_COMMUNITY_Agent Runtime Pipeline|Agent Runtime Pipeline]]
- [[_COMMUNITY_Database Schema Definitions|Database Schema Definitions]]
- [[_COMMUNITY_UI Library (shadcn)|UI Library (shadcn)]]
- [[_COMMUNITY_DB Foreign Key Relations|DB Foreign Key Relations]]
- [[_COMMUNITY_Memories & Persistence Schema|Memories & Persistence Schema]]
- [[_COMMUNITY_Extension Integrations (Speckit)|Extension Integrations (Speckit)]]
- [[_COMMUNITY_Server Actions & API Routes|Server Actions & API Routes]]
- [[_COMMUNITY_Speckit CLI Scripts|Speckit CLI Scripts]]
- [[_COMMUNITY_Workspace Store & Surfaces|Workspace Store & Surfaces]]
- [[_COMMUNITY_Configuration Files|Configuration Files]]
- [[_COMMUNITY_Auth & Middleware|Auth & Middleware]]
- [[_COMMUNITY_Daytona Tools|Daytona Tools]]
- [[_COMMUNITY_DB Migrations|DB Migrations]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 111 edges
2. `auth()` - 42 edges
3. `Button()` - 26 edges
4. `useWorkspaceStore` - 20 edges
5. `compilerOptions` - 16 edges
6. `compilerOptions` - 16 edges
7. `Input()` - 14 edges
8. `getSupervisorModel()` - 13 edges
9. `files` - 12 edges
10. `createdAt` - 12 edges

## Surprising Connections (you probably didn't know these)
- `getConversation()` --calls--> `auth()`  [INFERRED]
  src/lib/server/actions/conversations.ts → src/lib/session.ts
- `AppLayout()` --calls--> `auth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/lib/session.ts
- `AdminPage()` --calls--> `auth()`  [INFERRED]
  src/app/admin/page.tsx → src/lib/session.ts
- `AvatarImage()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/avatar.tsx → src/lib/utils.ts
- `AvatarBadge()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/avatar.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (115 total, 30 thin omitted)

### Community 0 - "Frontend UI Components"
Cohesion: 0.07
Nodes (43): AppShell(), navItems, authClient, NoteListItem, PROVIDERS, authClient, AgentOutputSurface(), ARTIFACT_ICONS (+35 more)

### Community 1 - "Dependencies & Package Config"
Cohesion: 0.03
Nodes (70): dependencies, ai, @ai-sdk/anthropic, @ai-sdk/deepseek, @ai-sdk/google, @ai-sdk/groq, @ai-sdk/mistral, @ai-sdk/openai (+62 more)

### Community 2 - "Agent Runtime Pipeline"
Cohesion: 0.05
Nodes (44): DexterAgent, compiledGraph, GraphState, GraphStateType, supervisor(), toolNode, workflow, resolveModel() (+36 more)

### Community 3 - "Database Schema Definitions"
Cohesion: 0.05
Nodes (39): conversationId, role, toolCallId, toolCalls, name, notNull, primaryKey, type (+31 more)

### Community 4 - "UI Library (shadcn)"
Cohesion: 0.12
Nodes (27): cn(), CardAction(), Checkbox(), Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput() (+19 more)

### Community 5 - "DB Foreign Key Relations"
Cohesion: 0.08
Nodes (26): columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo, columnsFrom (+18 more)

### Community 6 - "Memories & Persistence Schema"
Cohesion: 0.08
Nodes (26): memories_sourceConversationId_conversations_id_fk, memories_userId_user_id_fk, columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom (+18 more)

### Community 7 - "Extension Integrations (Speckit)"
Cohesion: 0.09
Nodes (24): invoke_separator, script, invoke_separator, script, invoke_separator, script, default_integration, installed_integrations (+16 more)

### Community 8 - "Server Actions & API Routes"
Cohesion: 0.13
Nodes (14): createNote(), deleteNote(), getNotes(), updateNote(), AdminPage(), AppLayout(), LandingPage(), POST() (+6 more)

### Community 9 - "Speckit CLI Scripts"
Cohesion: 0.17
Nodes (20): check_dir(), check_feature_branch(), check_file(), feature_json_matches_feature_dir(), find_feature_dir_by_prefix(), find_specify_root(), format_speckit_command(), get_current_branch() (+12 more)

### Community 10 - "Workspace Store & Surfaces"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "Configuration Files"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 12 - "Auth & Middleware"
Cohesion: 0.16
Nodes (16): ChatPage(), DEFAULT_MODELS, useWorkspaceTools(), MODEL_MAPPING, ModelSelectorProps, Badge(), badgeVariants, SelectContent() (+8 more)

### Community 13 - "Daytona Tools"
Cohesion: 0.10
Nodes (21): name, notNull, primaryKey, type, args, command, env, transportType (+13 more)

### Community 14 - "DB Migrations"
Cohesion: 0.22
Nodes (11): conversations, documents, vector, mcpServers, vector, projects, tasks, account (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (19): ApiKey, Artifact, ArtifactType, AttachmentMeta, Conversation, Document, KnowledgeBase, McpServer (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (18): columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo, api_keys_userId_user_id_fk (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (18): mcp_servers_userId_user_id_fk, columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (17): instructions, name, updatedAt, name, notNull, primaryKey, type, name (+9 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (17): devDependencies, drizzle-kit, eslint, eslint-config-next, jsdom, tailwindcss, @tailwindcss/postcss, @types/bcryptjs (+9 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (5): signOut(), { GET, POST }, auth, config, publicPaths

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (14): files, .specify/scripts/bash/check-prerequisites.sh, .specify/scripts/bash/common.sh, .specify/scripts/bash/create-new-feature.sh, .specify/scripts/bash/setup-plan.sh, .specify/scripts/bash/setup-tasks.sh, .specify/templates/checklist-template.md, .specify/templates/constitution-template.md (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (16): embedding, metadata, type, name, notNull, primaryKey, type, name (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (16): encryptedKey, iv, provider, name, notNull, primaryKey, type, name (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (16): model, projectId, title, name, notNull, primaryKey, type, name (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (16): sourceConversationId, tags, userId, columns, name, notNull, primaryKey, type (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.19
Nodes (11): createProject(), deleteProject(), getProjects(), updateProject(), requireAuth(), db, pool, ProjectsRoute() (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (13): files, .agents/skills/speckit-analyze/SKILL.md, .agents/skills/speckit-checklist/SKILL.md, .agents/skills/speckit-clarify/SKILL.md, .agents/skills/speckit-constitution/SKILL.md, .agents/skills/speckit-implement/SKILL.md, .agents/skills/speckit-plan/SKILL.md, .agents/skills/speckit-specify/SKILL.md (+5 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (13): files, .claude/skills/speckit-analyze/SKILL.md, .claude/skills/speckit-checklist/SKILL.md, .claude/skills/speckit-clarify/SKILL.md, .claude/skills/speckit-constitution/SKILL.md, .claude/skills/speckit-implement/SKILL.md, .claude/skills/speckit-plan/SKILL.md, .claude/skills/speckit-specify/SKILL.md (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (13): files, .agents/skills/speckit-analyze/SKILL.md, .agents/skills/speckit-checklist/SKILL.md, .agents/skills/speckit-clarify/SKILL.md, .agents/skills/speckit-constitution/SKILL.md, .agents/skills/speckit-implement/SKILL.md, .agents/skills/speckit-plan/SKILL.md, .agents/skills/speckit-specify/SKILL.md (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.16
Nodes (13): files, .opencode/commands/speckit.analyze.md, .opencode/commands/speckit.checklist.md, .opencode/commands/speckit.clarify.md, .opencode/commands/speckit.constitution.md, .opencode/commands/speckit.implement.md, .opencode/commands/speckit.plan.md, .opencode/commands/speckit.specify.md (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (13): files, .pi/prompts/speckit.analyze.md, .pi/prompts/speckit.checklist.md, .pi/prompts/speckit.clarify.md, .pi/prompts/speckit.constitution.md, .pi/prompts/speckit.implement.md, .pi/prompts/speckit.plan.md, .pi/prompts/speckit.specify.md (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.16
Nodes (13): files, .qoder/commands/speckit.analyze.md, .qoder/commands/speckit.checklist.md, .qoder/commands/speckit.clarify.md, .qoder/commands/speckit.constitution.md, .qoder/commands/speckit.implement.md, .qoder/commands/speckit.plan.md, .qoder/commands/speckit.specify.md (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (15): completed, description, priority, default, name, notNull, primaryKey, type (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.26
Nodes (11): ProjectListItem, Dialog(), DialogClose(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay() (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.27
Nodes (10): createConversation(), deleteConversation(), getConversation(), getConversations(), updateConversation(), createMessage(), deleteMessage(), getMessages() (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (12): name, private, scripts, build, dev, dev:prod, dev:turbo, lint (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.27
Nodes (11): _byte_length(), _find_project_root(), check_existing_branches(), clean_branch_name(), _extract_highest_number(), generate_branch_name(), get_highest_from_branches(), get_highest_from_remote_refs() (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (6): inter, metadata, viewport, Toaster(), TooltipContent(), TooltipProvider()

### Community 42 - "Community 42"
Cohesion: 0.31
Nodes (9): check_existing_branches(), clean_branch_name(), _extract_highest_number(), generate_branch_name(), get_highest_from_branches(), get_highest_from_remote_refs(), get_highest_from_specs(), create-new-feature.sh script (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (9): schema_version, description, installed_at, name, source, updated_at, version, workflows (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (6): SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 45 - "Community 45"
Cohesion: 0.40
Nodes (8): deleteApiKey(), getApiKeys(), getSession(), getUserSettings(), saveApiKey(), updateUserSettings(), apiKeys, SettingsRoute()

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (6): createTask(), deleteTask(), getTasks(), updateTask(), TasksRoute(), TaskListItem

### Community 47 - "Community 47"
Cohesion: 0.49
Nodes (8): ConvertTo-CleanBranchName(), Find-ProjectRoot(), Get-BranchName(), Get-HighestNumberFromBranches(), Get-HighestNumberFromNames(), Get-HighestNumberFromRemoteRefs(), Get-HighestNumberFromSpecs(), Get-NextBranchNumber()

### Community 48 - "Community 48"
Cohesion: 0.28
Nodes (7): navItems, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage()

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (9): columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo, conversations_projectId_projects_id_fk (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (8): dialect, id, prevId, name, schema, tables, public.tasks, version

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (9): projects_userId_user_id_fk, columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (9): checkConstraints, compositePrimaryKeys, indexes, isRLSEnabled, name, policies, schema, uniqueConstraints (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (9): checkConstraints, compositePrimaryKeys, indexes, isRLSEnabled, name, policies, schema, uniqueConstraints (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.39
Nodes (7): ai, ai_skills, branch_numbering, here, integration, script, speckit_version

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (8): columnsFrom, columnsTo, name, onDelete, onUpdate, tableFrom, tableTo, conversations_userId_user_id_fk

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): computedHash, skillPath, source, sourceType, skills, neon-postgres, version

### Community 57 - "Community 57"
Cohesion: 0.38
Nodes (5): check_feature_branch(), has_git(), spec_kit_effective_branch_name(), git-common.sh script, git-common.sh script

### Community 58 - "Community 58"
Cohesion: 0.29
Nodes (5): AppSessionUser, {
  handlers,
  auth: nextAuth,
  signIn,
  signOut,
}, JWT, Session, User

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (4): PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle()

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (6): createdAt, default, name, notNull, primaryKey, type

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (6): enabled, default, name, notNull, primaryKey, type

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (6): id, default, name, notNull, primaryKey, type

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (6): pinned, default, name, notNull, primaryKey, type

### Community 65 - "Community 65"
Cohesion: 0.40
Nodes (3): _find_project_root(), auto-commit.sh script, auto-commit.sh script

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (3): _find_project_root(), initialize-repo.sh script, initialize-repo.sh script

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (5): content, name, notNull, primaryKey, type

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (5): threadId, name, notNull, primaryKey, type

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (5): url, name, notNull, primaryKey, type

### Community 70 - "Community 70"
Cohesion: 0.70
Nodes (3): Get-SpecKitEffectiveBranchName(), Test-FeatureBranch(), Test-HasGit()

### Community 71 - "Community 71"
Cohesion: 0.83
Nodes (3): decryptKey(), encryptKey(), getSecret()

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): dialect, entries, version

## Knowledge Gaps
- **634 isolated node(s):** `nextId`, `tasks`, `update-agent-context.sh script`, `auto-commit.sh script`, `create-new-feature.sh script` (+629 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Library (shadcn)` to `Frontend UI Components`, `Community 37`, `Community 41`, `Community 75`, `Auth & Middleware`, `Community 44`, `Community 48`, `Community 59`, `Community 28`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `auth()` connect `Server Actions & API Routes` to `Community 46`, `Community 45`, `Community 29`, `Community 38`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `tables` connect `Community 50` to `Database Schema Definitions`, `DB Foreign Key Relations`, `Memories & Persistence Schema`, `Community 18`, `Community 19`, `Community 52`, `Community 53`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `auth()` (e.g. with `createConversation()` and `deleteConversation()`) actually correct?**
  _`auth()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextId`, `tasks`, `update-agent-context.sh script` to the rest of the system?**
  _634 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07023214810461358 - nodes in this community are weakly interconnected._
- **Should `Dependencies & Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.02857142857142857 - nodes in this community are weakly interconnected._