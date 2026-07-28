# Dakiya — Implementation Phases

> Ordered work from skeleton → marketable MVP.  
> Plan: [plan.md](./plan.md) · Checklist: [checklist.md](./checklist.md) · Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Phase 0 — Documentation & skeleton ✅

**Goal:** Anyone opening the repo understands the product and can run a hello-world monorepo.

| Deliverable | Status |
|-------------|--------|
| `docs/ARCHITECTURE.md` | Done |
| `docs/plan.md` | Done |
| `docs/phases.md` | Done |
| `docs/checklist.md` | Done |
| pnpm workspace + package stubs | Done |
| Hello-world CLI / web / packages | Done |

**Exit criteria:** `pnpm install` works; `pnpm hello` prints hello; `dakiya serve` serves the web dashboard.

---

## Phase 1 — Domain + `.drq` format ✅

**Goal:** Canonical on-disk contract and a trustworthy parser.

- [x] `@dakiya/domain` — Zod models for Workspace, Request, Environment, Example, Script
- [x] `@dakiya/format` — parse / serialize `.drq` (all v1 blocks)
- [x] Round-trip Vitest fixtures (lossless save)
- [x] Format cheat sheet under `docs/` ([drq-format.md](./drq-format.md))
- [x] Fixture `.drq` files in `packages/format/src/__fixtures__/`

**Exit criteria:** Fixture `.drq` → parse → serialize → equal. **Met** — run `pnpm --filter @dakiya/format test`.

**Notes:** `@file(...)` refs are stored in the model; loading file contents at parse time is deferred. `@assert` blocks are parsed but not executed.

---

## Phase 2 — Services (platform-agnostic) ✅

**Goal:** Business logic with injected interfaces (no Node/React imports).

- [x] `scaffoldWorkspace()` — manifest, env, empty `collections/`
- [x] `RequestService` — load / save / delete / list paths
- [x] `EnvironmentService` — load / save YAML
- [x] `resolveVars` / `resolveRequest` — `{{var}}` substitution
- [x] `sendRequest()` — vars → pre → HTTP → post
- [x] `FsClient` interface + `createMemoryFs` for tests
- [x] `ScriptRunner` contract (sandbox stays in CLI Layer 4)
- [x] `buildCollectionTree()` for sidebar-style folder trees

**Exit criteria:** Unit tests for var resolve + script hooks with mock `HttpClient` / `FsClient`. **Met** — run `pnpm --filter @dakiya/services test`.

---

## Phase 3 — CLI app (`apps/cli`) ✅

**Goal:** Real commands developers run — including a terminal API runner before the web dashboard.

- [x] `dakiya init` (production-clean scaffold via `scaffoldWorkspace`)
- [x] Node fs wiring via `createNodeFsClient()` → services
- [x] `dakiya list` + `dakiya run <path>` (parse → env → scripts → send → print)
- [x] Hono: `/api/health`, workspace, requests CRUD, environments, `/api/send`
- [x] `dakiya serve` (port 4242, Vite + API middleware)
- [x] VM script sandbox wired into `run` and `/api/send`

**Exit criteria (starter):** With `@example/server` up: `dakiya list` and `dakiya run health/health` return real HTTP responses. **Met.**  
**Exit criteria (full Phase 3):** `init` → `serve` → hit health + load request via API. **Met.**

---

## Phase 4 — Web app (`apps/web`) ✅

**Goal:** Browser UI that uses the local API only (no direct disk).

- [x] Layout: titlebar, sidebar tree, request editor, response panel, status bar
- [x] Postman-style split panes (request left, response right)
- [x] Tabs: Source, Docs, Scripts (view), Examples
- [x] TanStack Query API client
- [x] Send via `POST /api/send`
- [x] Env switcher + YAML editor modal through API
- [x] Inter + JetBrains Mono typography; green accent theme

**Exit criteria:** Full click-path without CLI knowledge beyond `dakiya serve`. **Met** (scripts edited via Source tab).

---

## Phase 5 — Polish & ship MVP ✅

**Goal:** Marketable first release.

- [x] Error UX (API unreachable, parse errors on save, send failures with URL hint)
- [x] README quickstart aligned with ABOUT.md
- [x] Web dashboard: auto-select first request, save-then-send, unsaved-change guard
- [x] Known limitations documented in README
- [ ] Optional: `dakiya export curl` (nice-to-have, deferred)

**Exit criteria:** External developer completes quickstart without hand-holding. **Met** — see README and manual smoke in [checklist.md](./checklist.md).

---

## Phase 6 — Desktop (optional, later)

Only if needed after market feedback.

- [ ] `apps/desktop` Tauri shell
- [ ] Tauri Layer 4 adapters
- [ ] Point at same `@dakiya/web` UI

**Exit criteria:** Same `.dakiya` folder works in CLI/web and desktop without conversion.

---

## Explicitly deferred (do not pull into MVP)

| Item | Notes |
|------|-------|
| Python scripts | Window open; not scheduled |
| SQLite history | v0.2 candidate |
| Bruno / Postman import | v0.2 |
| OAuth / cloud / telemetry | Never for core path; OAuth auth helpers later |
| Collection script inheritance execution | Format may allow; run later |
| GraphQL / gRPC / WS | HTTP only in MVP |
| `@assert` execution | Parsed only; run later |
| `@file(...)` content resolution at parse time | Path preserved in model |
