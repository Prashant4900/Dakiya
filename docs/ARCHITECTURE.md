# Dakiya — Architecture

> Technical contract for the Dakiya API toolkit (CLI, web dashboard, optional desktop).  
> Product context: [../ABOUT.md](../ABOUT.md) · Roadmap: [plan.md](./plan.md) · Phases: [phases.md](./phases.md)

---

## Principles

1. **Local-first** — All user data stays on disk. No accounts, no cloud sync.
2. **Files as source of truth** — Collections live in `.dakiya/` as plain, Git-friendly files (`.drq`, YAML).
3. **Four fixed layers** — UI, State, Services, Infrastructure stay separate; do not merge or skip layers.
4. **One core, many surfaces** — Domain and services are shared; CLI, web, and desktop differ only in Layer 4 adapters and shell.
5. **Testable core** — Services are pure TypeScript; infrastructure is swappable behind interfaces.
6. **Privacy by default** — Analytics and telemetry are opt-in only (not in MVP).

---

## Delivery surfaces

```
                    ┌─────────────────────────────────────┐
                    │  Shared core (packages/)            │
                    │  domain · format · services         │
                    └──────────────┬──────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│  apps/cli       │    │  apps/web           │    │  apps/desktop   │
│  dakiya init    │───▶│  (browser UI)       │    │  (Tauri — later)│
│  dakiya serve   │    │  localhost:4242     │    │                 │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
                                   │
                                   ▼
                            .dakiya/ on disk
```

**Rule of thumb:** anything a user *runs* (CLI, browser app, desktop app) lives under `apps/`. Shared libraries live under `packages/`.

| Surface | MVP | Role | Layer 4 backing |
|---------|-----|------|-----------------|
| **CLI** | Yes | `init` scaffolds; `serve` starts local server + UI | Node (`fs`, Hono) |
| **Web dashboard** | Yes | React UI against local HTTP API | Browser `fetch` → local server |
| **Desktop** | Later | Tauri shell wrapping same UI | Tauri `invoke` + plugins |

**Swagger-like workflow (MVP):**

```bash
cd my-api-project
dakiya init
dakiya serve   # http://localhost:4242
```

---

## Four-layer model

```
┌─────────────────────────────────────────────────────────────┐
│  1. UI Layer          Pure presentation (React)             │
│                       Shared by web dashboard & desktop     │
├─────────────────────────────────────────────────────────────┤
│  2. State Layer       Zustand (UI) + TanStack Query (async) │
├─────────────────────────────────────────────────────────────┤
│  3. Service Layer     Business logic — no React, no I/O     │
├─────────────────────────────────────────────────────────────┤
│  4. Infrastructure    Repos & clients (fs, http, sandbox)   │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Owns | Must not |
|-------|------|----------|
| **1. UI** | Layout, events, a11y | Import services/infra; hold business rules |
| **2. State** | Stores, query hooks; call services | Implement business rules; raw I/O |
| **3. Services** | Validation, orchestration | Import React or concrete Node/Tauri clients |
| **4. Infra** | Repos, clients, CLI, HTTP API | Contain UI or business rules |

**Dependency rule:** `UI → State → Services → Infra interfaces → domain`

**Web rule:** The browser never reads `.dakiya/` directly. The CLI server exposes a local HTTP API; web Layer 4 is `fetch` to that API.

---

## Monorepo layout

```
Dakiya/
  ABOUT.md
  docs/
    ARCHITECTURE.md   # this file
    plan.md
    phases.md
    checklist.md
  packages/                 # shared core libraries
    domain/                 # Zod types / parsed models
    format/                 # .drq parse + serialize
    services/               # Layer 3
  apps/                     # delivery surfaces (same kind of thing)
    cli/                    # Layer 4 Node — CLI bin, Hono, fs, sandbox
    web/                    # Layers 1–2 + browser API client
    desktop/                # Reserved — Tauri stub until needed
```

| Package / app | Path | Responsibility |
|---------------|------|----------------|
| `@dakiya/domain` | `packages/domain` | Shared types and Zod schemas |
| `@dakiya/format` | `packages/format` | `.drq` lexer/parser/serializer |
| `@dakiya/services` | `packages/services` | Workspace, Request, Environment, Script orchestration |
| `@dakiya/cli` | `apps/cli` | `dakiya` bin, Hono routes, Node fs, script sandbox |
| `@dakiya/web` | `apps/web` | React dashboard |
| `@dakiya/desktop` | `apps/desktop` | Tauri shell (later) |

---

## `.dakiya` on disk

```
project/
  .dakiya/
    dakiya.yaml               # workspace core / manifest
    collections/
      auth/
        login.drq
    environments/
      local.yaml
    examples/                 # optional large payloads
      auth/login-200.json
```

### `dakiya.yaml` (workspace core)

Manifest at the root of `.dakiya/`. Holds workspace metadata used by CLI, web, and desktop:

| Field | Purpose |
|-------|---------|
| `name` | Display name of the workspace |
| `description` | Short purpose / notes |
| `version` | Manifest schema version (currently `1`) |
| `defaultEnv` | Active environment key (file under `environments/`) |

Example:

```yaml
name: my-api
description: "A local-first API workspace for my-api."
version: 1
defaultEnv: local
```

### `.drq` (Dakiya Request)

Human-readable, block-based, one request per file. Curl-like `@request` section. Spec v1 is locked for MVP; refine later as needed.

Blocks: `@meta`, `@request`, `@body`, `@docs`, `@pre`, `@post`, `@example`, `@assert`.

See [plan.md](./plan.md) for a full example.

### Environments

YAML key-value files (`environments/local.yaml`). Variables resolve as `{{name}}` in URL, headers, and body.

---

## Scripts (pre / post)

| Language | MVP | Notes |
|----------|-----|-------|
| **JavaScript** | Yes | Primary sandbox language |
| **TypeScript** | Yes | Supported in `@pre` / `@post` (transpile or strip types before run) |
| **Python** | Later | Window left open — not implemented in MVP |

- **`@pre`** — mutate request / env before send  
- **`@post`** — mutate response / env after send (Dakiya differentiator)  
- Scripts run **server-side** on `POST /api/send` (isolated sandbox, no arbitrary fs/`require`)

Script API (MVP): `req.*`, `res.*`, `env.get` / `env.set`, `console.log`.

---

## Request send flow

```
User clicks Send
  → UI (useSendRequest)
  → POST /api/send
  → RequestService.send
       1. resolve {{vars}}
       2. run @pre (JS/TS sandbox)
       3. HttpClient.send
       4. run @post (JS/TS sandbox)
       5. return response (+ env updates)
  → UI shows body / headers / status
```

---

## Local HTTP API (MVP)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/workspace` | Manifest + folder tree |
| GET/PUT/POST/DELETE | `/api/requests/...` | CRUD `.drq` files |
| GET/PUT | `/api/environments/:name` | YAML envs |
| POST | `/api/send` | Pre → HTTP → post |

---

## Desktop (deferred)

When needed:

1. Implement `apps/desktop` (Tauri) wrapping `@dakiya/web`
2. Add Tauri Layer 4 adapters (`FsClient` via `invoke`)
3. Reuse `@dakiya/domain`, `@dakiya/format`, `@dakiya/services` unchanged

Do not fork the UI or rewrite services for desktop.

---

## Explicit non-goals (MVP)

- Cloud sync, accounts, analytics
- SQLite history (v0.2 candidate)
- Bruno / Postman import (v0.2)
- Collection-level script inheritance execution (format may allow; run later)
- GraphQL / gRPC / WebSocket (HTTP only for v0.1)
