# Dakiya — Implementation Phases

> Ordered work from skeleton → marketable MVP.  
> Plan: [plan.md](./plan.md) · Checklist: [checklist.md](./checklist.md) · Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Phase 0 — Documentation & skeleton (current)

**Goal:** Anyone opening the repo understands the product and can run a hello-world monorepo.

| Deliverable | Status |
|-------------|--------|
| `docs/ARCHITECTURE.md` | Done in this pass |
| `docs/plan.md` | Done in this pass |
| `docs/phases.md` | Done in this pass |
| `docs/checklist.md` | Done in this pass |
| pnpm workspace + package stubs | Done in this pass |
| Hello-world CLI / web / packages | Done in this pass |

**Exit criteria:** `pnpm install` works; `pnpm hello` (apps/cli) prints hello; `pnpm dev:web` (apps/web) shows a placeholder page.

---

## Phase 1 — Domain + `.drq` format

**Goal:** Canonical on-disk contract and a trustworthy parser.

- [ ] `@dakiya/domain` — Zod models for Workspace, Request, Environment, Example, Script
- [ ] `@dakiya/format` — parse / serialize `.drq` (all v1 blocks)
- [ ] Round-trip Vitest fixtures (lossless save)
- [ ] Format cheat sheet under `docs/` (1 page)
- [ ] Sample `.dakiya/` tree used in tests

**Exit criteria:** Fixture `.drq` → parse → serialize → equal (or intentional normalize rules documented).

---

## Phase 2 — Services (platform-agnostic)

**Goal:** Business logic with injected interfaces (no Node/React imports).

- [ ] `WorkspaceService.scaffold()`
- [ ] `RequestService` load / save / list tree
- [ ] `EnvironmentService` load YAML + `{{var}}` resolve
- [ ] `ScriptService` JS/TS sandbox APIs (`req`, `res`, `env`)
- [ ] `RequestService.send()` orchestration: vars → pre → HTTP → post

**Exit criteria:** Unit tests for var resolve + script hooks with mock `HttpClient` / `FsClient`.

---

## Phase 3 — CLI app (`apps/cli`)

**Goal:** Real local API and commands developers run.

- [ ] Node `FsClient` + repos reading `.dakiya/`
- [ ] Hono: `/api/health`, workspace, requests CRUD, environments, `/api/send`
- [ ] `dakiya init`
- [ ] `dakiya serve` (port 4242, open browser, serve `apps/web` assets)
- [ ] Wire script sandbox into `/api/send`

**Exit criteria:** From an empty folder: `init` → `serve` → hit health + load sample request via API.

---

## Phase 4 — Web app (`apps/web`)

**Goal:** Browser UI that uses the local API only (no direct disk).

- [ ] Layout: sidebar tree, request editor, response panel
- [ ] Tabs: Request, Body, Headers, Docs, Scripts (pre/post), Examples
- [ ] Zustand + TanStack Query
- [ ] Send via `POST /api/send`
- [ ] Env switcher + save back to `.drq` / YAML through API

**Exit criteria:** Full click-path without CLI knowledge beyond `dakiya serve`.

---

## Phase 5 — Polish & ship MVP

**Goal:** Marketable first release.

- [ ] Error UX (missing `.dakiya`, port in use, parse errors)
- [ ] README quickstart aligned with ABOUT.md
- [ ] Manual checklist pass ([checklist.md](./checklist.md))
- [ ] Optional: `dakiya export curl` (nice-to-have)

**Exit criteria:** External developer completes quickstart without hand-holding.

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
