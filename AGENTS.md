<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
specs/001-agentic-workspace-rebuild/plan.md
<!-- SPECKIT END -->

<!-- BEGIN:process -->
## Process & Tracking

### Bug & Feature Tracking
- Bugs from scans → GitHub Issues (label: `bug`, priority: `P0-critical`/`P1-high`/`P2-medium`)
- Features → Speckit (spec → plan → tasks) if large (>5 files), else GitHub Issue
- Active work gets a GitHub Issue before any code is written
- Issues close automatically when PR merges (link with `Closes #N`)

### Documentation
- Findings/reports: `docs/findings/YYYY-MM-DD-description.md`
- Architecture decisions: `docs/decisions/`
- Architecture diagrams: `docs/architecture/`
- Change log: `CHANGELOG.md` (update after every session)

### Code Hygiene (MANDATORY after every implementation/debugging session)

After changing ANY source file, audit every file you touched from its FIRST line to its LAST line. Check for:

1. **Duplicate logic/code** — Is the same function, component, or logic block defined twice?
2. **Conflicting sources of authority** — Are two files solving the same problem differently? Does an env var exist in two places with different defaults?
3. **Dead or orphaned code** — Exported functions/classes never imported? Unused variables? Code paths impossible to reach?
4. **Unplugged code** — A function/hook/component that IS defined correctly but NEVER called/wired (e.g., `useWorkspaceTools()` defined but not invoked)
5. **Bloat code** — Abstractions with 0 or 1 consumer? Over-generic types? Commented-out code? Unnecessary layers?

For each issue found: create a GitHub Issue or add it to the session's changelog entry.

### Tools
- **codegraph**: `codegraph query <symbol>`, `codegraph callers/callees <symbol>`, `codegraph impact <symbol>`
- **graphify**: `/graphify .` for full knowledge graph, `/graphify query "..."` for questions
- **GitHub**: Issues for tracking, PRs for merging, `CHANGELOG.md` for session logs
<!-- END:process -->
