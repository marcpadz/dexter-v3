# Tasks: Pre-Deployment Final Checks

**Input**: Ship-readiness assessment — 2 items remaining before deployment (Next.js 16 middleware migration + build verification)

**Prerequisites**: All 14 bug-fix tasks completed, all tests passing, TypeScript clean

**Tests**: Smoke tests included — verify app starts and routes work

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: [DPLY] (deployment milestone)
- Include exact file paths in descriptions

---

## Phase 1: Next.js 16 Middleware Migration (Blocks Build)

**Purpose**: Next.js 16 deprecates the `middleware` file convention in favor of `proxy`. Must migrate before the deprecation becomes a breaking change.

- [ ] T001 [DPLY] Rename `src/middleware.ts` → `src/proxy.ts` — Next.js 16 requires the proxy file convention instead of middleware. Keep the same logic but update the file name
- [ ] T002 [DPLY] Update proxy config in `src/proxy.ts` — the export config matcher format may differ for proxy. Change `export const config = { matcher: [...] }` to match the proxy convention. Research the Next.js 16 proxy docs for the correct matcher syntax if different
- [ ] T003 [P] [DPLY] Update auth middleware test to import from proxy — rename `src/__tests__/auth/middleware.test.ts` → `src/__tests__/auth/proxy.test.ts` and update the import path from `@/middleware` to `@/proxy`
- [ ] T004 [P] [DPLY] Verify auth gating still works — run the proxy test suite and manually verify `/chat` redirects unauthenticated users to `/auth/login` and `/auth/login` loads without session

**Checkpoint**: Middleware migrated to proxy, auth gates still active, tests pass

---

## Phase 2: Build & Runtime Verification (Ship Gate)

**Purpose**: Verify the production build completes and the app starts correctly before deployment.

- [ ] T005 [DPLY] Run production build — `npm run build` must complete without errors. If errors occur, fix and re-run. Maximum retries: 3
- [ ] T006 [P] [DPLY] Verify build output — check `.next/` directory for expected outputs: `BUILD_ID`, `build-manifest.json`, `prerender-manifest.json`. Missing outputs indicate a failed or partial build
- [ ] T007 [P] [DPLY] Verify no console warnings remain — scan build output for warnings (deprecation, missing deps, module resolution issues). Document and fix any found
- [ ] T008 [DPLY] Smoke test the built app — start with `npm run start` and verify: (a) root page loads (200), (b) `/auth/login` loads (200), (c) `/api/copilotkit` responds (POST returns non-500), (d) no uncaught errors in console
- [ ] T009 [DPLY] Verify all 44 tests pass against the built output — run `npx vitest run` and confirm 44/44 pass, 0 failures

**Checkpoint**: Build passes, app starts, all routes respond, all tests pass — **READY TO DEPLOY**

---

## Dependencies & Execution Order

- **Phase 1 (Middleware)**: No dependencies — start immediately
  - T001 must complete before T002 (file rename before config update)
  - T003 can run in parallel with T001-T002 (different file)
  - T004 depends on T001-T003
- **Phase 2 (Build)**: Depends on Phase 1 (proxy must be correct before build)
  - T005 must complete before T006-T008
  - T006, T007 can run after T005
  - T008 can run after T005
  - T009 can run anytime

---

## Parallel Example

```bash
# After T001-T002 complete:
T003: "Update proxy test file"
T005: "Run production build"  # Can start while T003 runs (different concern)
```

---

## Implementation Strategy

1. **T001-T002**: Migrate middleware → proxy (5 min)
2. **T003**: Update test import (2 min)
3. **T004**: Verify auth gating manually (2 min)
4. **T005**: Run `npm run build` (2–5 min)
5. **T006-T008**: Verify output and smoke test (3 min)
6. **T009**: Run full test suite (1 min)

**Total estimated time**: 15–20 minutes

---

## Deployment Criteria

All 9 tasks must be `[X]` before deploying:

- [ ] T001 Middleware renamed to proxy
- [ ] T002 Proxy config updated
- [ ] T003 Proxy test created
- [ ] T004 Auth gating verified
- [ ] T005 Build passes
- [ ] T006 Build output valid
- [ ] T007 No console warnings
- [ ] T008 Smoke test passes
- [ ] T009 All tests pass
