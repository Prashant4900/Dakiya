# Dakiya — Product & Technical Plan (MVP)

> Living plan for shipping CLI + web first. Desktop is optional later.  
> Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md) · Phases: [phases.md](./phases.md) · Checklist: [checklist.md](./checklist.md)

---

## Vision (one sentence)

Dakiya is a local-first API toolkit: your collections live in `.dakiya/` as human-readable files, you explore them via CLI + a local browser dashboard, and nothing syncs to a Dakiya cloud.

---

## MVP goal

Validate in market with **core functionality only**:

1. `dakiya init` — scaffold `.dakiya/` in a project  
2. `dakiya list` / `dakiya run` — discover and send requests from the terminal (no dashboard required)  
3. `dakiya serve` — local dashboard on `localhost`  
4. Edit / send HTTP requests stored as `requests.yaml`  
5. Environments (YAML) + `{{var}}` substitution  
6. Docs, examples, pre/post scripts (JS/TS) on send  

**Out of MVP:** desktop app, cloud, history DB, Postman/Bruno import, Python scripts.

---

## Strategy

| Priority | Surface | Why |
|----------|---------|-----|
| 1 | CLI + web | Covers Swagger-like workflow; no install friction for teammates |
| 2 | Shared core | Same domain/services/UI ready for desktop without rewrite |
| 3 | Desktop | Only if market asks — same codebase, new Layer 4 shell |

---

## Why not JSON for collections?

Large nested bodies, scripts, and docs make JSON painful to read and review in Git. Dakiya uses **`requests.yaml`** (custom block format) with a curl-like `@request` block.

| Option | Decision |
|--------|----------|
| JSON files | Rejected for authoring |
| Bruno `.bru` | Useful reference; not adopted (less control) |
| **Custom `requests.yaml`** | **Chosen** — full control; refine syntax later if needed |

Environments use **YAML** (human-readable key-value).

---

## `requests.yaml` example (v1 — locked for MVP authoring)

```yaml
@meta
name: Login
type: http

@request
POST {{baseUrl}}/auth/login
Content-Type: application/json

@body
{
  "email": "{{email}}",
  "password": "{{password}}"
}

@docs
# Login
Authenticates a user and stores `token` via post-script.

@pre lang=js
env.set("requestId", crypto.randomUUID())
req.setHeader("X-Request-Id", env.get("requestId"))

@post lang=ts
if (res.status === 200) {
  const body = res.json() as { accessToken: string }
  env.set("token", body.accessToken, { persist: true })
}

@example Success
status: 200
response: @file(examples/auth/login-200.json)
```

**Scripts:** JS and TS both supported via `lang=js` / `lang=ts` (default `js`). Python left as a future option — not in MVP.

---

## Monorepo layout

```
packages/domain     — types + Zod          (shared)
packages/format     — requests.yaml parse/serialize (shared)
packages/services   — business logic       (shared)

apps/cli            — dakiya CLI + local Hono server  (surface)
apps/web            — React dashboard                 (surface)
apps/desktop        — Tauri stub                      (surface, later)
```

---

## Current stage: Stage 4 — MVP shipped

| Stage | Meaning |
|-------|---------|
| **0** | Docs only (`ABOUT.md`) |
| **1** | Docs + hello-world monorepo skeleton |
| **2** | Domain, `requests.yaml` format, services — **done** |
| **3** | CLI + local API + web dashboard — **done** |
| **4** | Ship MVP (polish, docs, manual QA) — **done** |

**Delivered so far:**

- Zod schemas + `requests.yaml` parse/serialize with Vitest round-trip fixtures
- Platform-agnostic services (`FsClient`, workspace/request/env, send pipeline)
- CLI commands: `init`, `list`, `run`, `serve`
- Local Hono API: workspace, CRUD, environments, `POST /api/send`
- Pre/post JS/TS scripts with env persistence
- React web dashboard: collection sidebar, request editor (Source/Docs/Scripts/Examples), response panel, env switcher — all via `/api/*`
- Error UX in web UI, save-then-send, auto-select first request

**Next:** Optional desktop (Phase 6) or v0.2 (import, history). See [phases.md](./phases.md).

---

## Success criteria (full MVP — later)

1. `dakiya init && dakiya serve` works in &lt; 30s  
2. `requests.yaml` files are editable by hand and round-trip through the UI  
3. Pre/post JS/TS scripts run on send; post can mutate response / env  
4. Teammate clones repo → `dakiya serve` → tests APIs (no desktop)  
5. Desktop can be added without rewriting core  

---

## Risks

| Risk | Mitigation |
|------|------------|
| Custom format learning curve | Cheat sheet + starters in `init`; curl export later |
| Parser complexity | Round-trip Vitest fixtures before UI polish |
| Script sandbox | Server-side only; timeouts; no fs/`require` |
| Over-building desktop | Stub only until demand |

---

## Decisions locked for MVP

| Topic | Choice |
|-------|--------|
| Package manager | pnpm workspaces |
| CLI / server | Node + Hono |
| Web | Vite + React |
| Request format | `requests.yaml` (custom) |
| Env format | YAML |
| Scripts | JS + TS; Python later |
| Desktop | Optional, same monorepo |
| History / SQLite | Deferred |
