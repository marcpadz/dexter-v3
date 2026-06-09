# Graph Report - .  (2026-06-09)

## Corpus Check
- 298 files · ~116,418 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 606 nodes · 849 edges · 57 communities (42 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Server Actions (Data)|Server Actions (Data)]]
- [[_COMMUNITY_App Pages & Views|App Pages & Views]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Speckit Integrations Config|Speckit Integrations Config]]
- [[_COMMUNITY_UI Components (Core)|UI Components (Core)]]
- [[_COMMUNITY_Component Aliases & Icons|Component Aliases & Icons]]
- [[_COMMUNITY_UI Components (Overlay)|UI Components (Overlay)]]
- [[_COMMUNITY_Speckit Bash Scripts|Speckit Bash Scripts]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Chat Page & UI Widgets|Chat Page & UI Widgets]]
- [[_COMMUNITY_UI Components (Dropdown)|UI Components (Dropdown)]]
- [[_COMMUNITY_Speckit Manifest Files|Speckit Manifest Files]]
- [[_COMMUNITY_AGY Integration|AGY Integration]]
- [[_COMMUNITY_Claude Integration|Claude Integration]]
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
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 109 edges
2. `auth()` - 42 edges
3. `Button()` - 16 edges
4. `compilerOptions` - 16 edges
5. `files` - 11 edges
6. `files` - 10 edges
7. `files` - 10 edges
8. `files` - 10 edges
9. `files` - 10 edges
10. `files` - 10 edges

## Surprising Connections (you probably didn't know these)
- `DialogOverlay()` --calls--> `cn()`  [INFERRED]
  src/components/ui/dialog.tsx → src/lib/utils.ts
- `DialogFooter()` --calls--> `cn()`  [INFERRED]
  src/components/ui/dialog.tsx → src/lib/utils.ts
- `AppLayout()` --calls--> `auth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/lib/session.ts
- `AdminPage()` --calls--> `auth()`  [INFERRED]
  src/app/admin/page.tsx → src/lib/session.ts
- `AvatarImage()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/avatar.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (57 total, 15 thin omitted)

### Community 0 - "Package Dependencies"
Cohesion: 0.04
Nodes (50): dependencies, ai, @ai-sdk/anthropic, @ai-sdk/deepseek, @ai-sdk/google, @ai-sdk/groq, @ai-sdk/mistral, @ai-sdk/openai (+42 more)

### Community 1 - "Server Actions (Data)"
Cohesion: 0.07
Nodes (33): createConversation(), deleteConversation(), getConversation(), getConversations(), updateConversation(), createMessage(), deleteMessage(), getMessages() (+25 more)

### Community 2 - "App Pages & Views"
Cohesion: 0.15
Nodes (18): NoteListItem, ProjectListItem, Button(), ButtonProps, buttonVariants, Card(), CardContent(), CardDescription() (+10 more)

### Community 3 - "Dev Dependencies"
Cohesion: 0.08
Nodes (24): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs, @types/date-fns, @types/node (+16 more)

### Community 4 - "Speckit Integrations Config"
Cohesion: 0.08
Nodes (24): invoke_separator, script, invoke_separator, script, invoke_separator, script, default_integration, installed_integrations (+16 more)

### Community 5 - "UI Components (Core)"
Cohesion: 0.13
Nodes (16): cn(), CardAction(), CardFooter(), Progress(), ProgressIndicator(), ProgressLabel(), ProgressTrack(), ProgressValue() (+8 more)

### Community 6 - "Component Aliases & Icons"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "UI Components (Overlay)"
Cohesion: 0.11
Nodes (17): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator() (+9 more)

### Community 8 - "Speckit Bash Scripts"
Cohesion: 0.11
Nodes (4): get_current_branch(), get_feature_paths(), has_git(), common.sh script

### Community 9 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "Chat Page & UI Widgets"
Cohesion: 0.17
Nodes (12): DEFAULT_MODELS, Badge(), badgeVariants, SelectContent(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton() (+4 more)

### Community 11 - "UI Components (Dropdown)"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 12 - "Speckit Manifest Files"
Cohesion: 0.13
Nodes (14): files, .specify/scripts/bash/check-prerequisites.sh, .specify/scripts/bash/common.sh, .specify/scripts/bash/create-new-feature.sh, .specify/scripts/bash/setup-plan.sh, .specify/scripts/bash/setup-tasks.sh, .specify/templates/checklist-template.md, .specify/templates/constitution-template.md (+6 more)

### Community 13 - "AGY Integration"
Cohesion: 0.14
Nodes (13): files, .agents/skills/speckit-analyze/SKILL.md, .agents/skills/speckit-checklist/SKILL.md, .agents/skills/speckit-clarify/SKILL.md, .agents/skills/speckit-constitution/SKILL.md, .agents/skills/speckit-implement/SKILL.md, .agents/skills/speckit-plan/SKILL.md, .agents/skills/speckit-specify/SKILL.md (+5 more)

### Community 14 - "Claude Integration"
Cohesion: 0.14
Nodes (13): files, .claude/skills/speckit-analyze/SKILL.md, .claude/skills/speckit-checklist/SKILL.md, .claude/skills/speckit-clarify/SKILL.md, .claude/skills/speckit-constitution/SKILL.md, .claude/skills/speckit-implement/SKILL.md, .claude/skills/speckit-plan/SKILL.md, .claude/skills/speckit-specify/SKILL.md (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (13): files, .agents/skills/speckit-analyze/SKILL.md, .agents/skills/speckit-checklist/SKILL.md, .agents/skills/speckit-clarify/SKILL.md, .agents/skills/speckit-constitution/SKILL.md, .agents/skills/speckit-implement/SKILL.md, .agents/skills/speckit-plan/SKILL.md, .agents/skills/speckit-specify/SKILL.md (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (13): files, .opencode/commands/speckit.analyze.md, .opencode/commands/speckit.checklist.md, .opencode/commands/speckit.clarify.md, .opencode/commands/speckit.constitution.md, .opencode/commands/speckit.implement.md, .opencode/commands/speckit.plan.md, .opencode/commands/speckit.specify.md (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (13): files, .pi/prompts/speckit.analyze.md, .pi/prompts/speckit.checklist.md, .pi/prompts/speckit.clarify.md, .pi/prompts/speckit.constitution.md, .pi/prompts/speckit.implement.md, .pi/prompts/speckit.plan.md, .pi/prompts/speckit.specify.md (+5 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (13): files, .qoder/commands/speckit.analyze.md, .qoder/commands/speckit.checklist.md, .qoder/commands/speckit.clarify.md, .qoder/commands/speckit.constitution.md, .qoder/commands/speckit.implement.md, .qoder/commands/speckit.plan.md, .qoder/commands/speckit.specify.md (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.27
Nodes (7): createTask(), deleteTask(), getTasks(), updateTask(), TasksRoute(), TaskListItem, Checkbox()

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (6): inter, metadata, viewport, Toaster(), TooltipContent(), TooltipProvider()

### Community 21 - "Community 21"
Cohesion: 0.23
Nodes (5): navItems, HoverCardContent(), ScrollArea(), ScrollBar(), Separator()

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (3): _extract_highest_number(), get_highest_from_branches(), create-new-feature.sh script

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (10): AttachmentMeta, Conversation, KnowledgeBase, Message, ModelConfig, Note, Project, ProviderConfig (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.20
Nodes (9): schema_version, description, installed_at, name, source, updated_at, version, workflows (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.28
Nodes (7): navItems, Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage()

### Community 26 - "Community 26"
Cohesion: 0.39
Nodes (7): ConvertTo-CleanBranchName(), Get-BranchName(), Get-HighestNumberFromBranches(), Get-HighestNumberFromNames(), Get-HighestNumberFromRemoteRefs(), Get-HighestNumberFromSpecs(), Get-NextBranchNumber()

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (3): _extract_highest_number(), get_highest_from_branches(), create-new-feature.sh script

### Community 28 - "Community 28"
Cohesion: 0.28
Nodes (8): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea()

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (7): ai, ai_skills, branch_numbering, here, integration, script, speckit_version

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (5): AppSessionUser, {
  handlers,
  auth: nextAuth,
  signIn,
  signOut,
}, JWT, Session, User

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (4): PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle()

## Knowledge Gaps
- **267 isolated node(s):** `nextId`, `tasks`, `update-agent-context.sh script`, `auto-commit.sh script`, `create-new-feature.sh script` (+262 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Components (Core)` to `App Pages & Views`, `UI Components (Overlay)`, `Chat Page & UI Widgets`, `UI Components (Dropdown)`, `Community 19`, `Community 20`, `Community 21`, `Community 25`, `Community 28`, `Community 31`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `auth()` connect `Server Actions (Data)` to `Community 19`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Button()` connect `App Pages & Views` to `Server Actions (Data)`, `UI Components (Core)`, `UI Components (Overlay)`, `Chat Page & UI Widgets`, `Community 19`, `Community 21`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `cn()` (e.g. with `DialogContent()` and `DialogDescription()`) actually correct?**
  _`cn()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `auth()` (e.g. with `createConversation()` and `deleteConversation()`) actually correct?**
  _`auth()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextId`, `tasks`, `update-agent-context.sh script` to the rest of the system?**
  _267 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._