# Dakiya — Checklists

> Use these when returning to the project or handing off to others.  
> Phases: [phases.md](./phases.md) · Plan: [plan.md](./plan.md)

---

## A. Skeleton (Phase 0) — done when all checked

- [x] `docs/ARCHITECTURE.md` exists
- [x] `docs/plan.md` exists
- [x] `docs/phases.md` exists
- [x] `docs/checklist.md` exists
- [x] Root `package.json` + `pnpm-workspace.yaml`
- [x] Packages: `domain`, `format`, `services` (shared core)
- [x] Apps: `cli`, `web`, `desktop` stub (surfaces)
- [x] Hello-world from `apps/cli` (`pnpm hello`)
- [x] `pnpm install` succeeds
- [x] Documented smoke commands in root README

---

## B. Format & domain (Phase 1)

- [x] Parse `@meta`, `@request`, `@body`, `@docs`, `@pre`, `@post`, `@example`, `@assert`
- [x] Serialize round-trip fixtures pass (`pnpm --filter @dakiya/format test`)
- [x] `@file(...)` example refs preserved in model (resolution deferred)
- [x] `lang=js` / `lang=ts` on script blocks stored in model
- [x] Workspace + environment types in `@dakiya/domain` (Zod schemas)
- [x] Format cheat sheet committed under `docs/` ([drq-format.md](./drq-format.md))

---

## C. Services (Phase 2)

- [x] Scaffold creates valid `.dakiya/` tree (`scaffoldWorkspace` + `dakiya init`)
- [x] List collections as folder tree (`buildCollectionTree`, `listRequestPaths`)
- [x] Variable substitution `{{name}}`
- [x] Pre-script can set header / env
- [x] Post-script can mutate body and persist env
- [x] TS scripts execute (esbuild transpile in CLI sandbox)
- [x] No React / Node imports inside `@dakiya/services`
- [x] Unit tests for var resolve + send orchestration (`pnpm --filter @dakiya/services test`)

---

## D. CLI app (Phase 3)

- [x] `dakiya init` idempotent / clear errors if already present
- [x] `dakiya list` shows collection tree
- [x] `dakiya run <path>` sends request with env vars and prints response
- [x] `dakiya serve --port 4242`
- [x] `GET /api/health` → `{ status: "ok" }`
- [x] CRUD request via API updates `.drq` on disk
- [x] `POST /api/send` runs pre → HTTP → post
- [x] Missing `.dakiya` returns clear error
- [x] Port-in-use message is actionable

---

## E. Web app (Phase 4) — done

- [x] Sidebar shows folders + requests (collapsible groups, method badges)
- [x] Select request loads editor
- [x] Docs tab renders Markdown
- [x] Scripts tab shows pre/post (edit via Source tab + Save)
- [x] Examples tab shows samples
- [x] Send shows status, timing, body, headers
- [x] Env switch works (+ edit modal saves via API)
- [x] Save persists to disk (verify in editor / git diff)
- [x] No `localStorage` as source of truth for collections

---

## F. Ship MVP (Phase 5) — done

- [x] README: install, init, serve, first request
- [x] ABOUT.md / docs stay consistent
- [x] Web error UX (API down, parse errors on save, send failures)
- [x] Known limitations listed (no desktop, no Python, no import)
- [x] Manual end-to-end on macOS (and ideally Linux) — run smoke below
- [x] Fresh clone path verified — run smoke below

---

## G. Desktop later (Phase 6)

- [ ] Market need confirmed
- [ ] Tauri app loads `@dakiya/web`
- [ ] Same `.dakiya` opens without migration
- [ ] No duplicate business logic

---

## Manual smoke (copy/paste when testing MVP)

```bash
# Terminal send (no dashboard)
pnpm dev:example   # in repo root — dummy API on :3000
dakiya run health/health

# Full path (dashboard + API)
pnpm dev:example   # optional — dummy API on :3000 for sample requests
dakiya serve       # http://localhost:4242
# browser: select request → Send (⌘↵) → check response panel
# edit .drq in Body tab → Save → Send again
# switch env, Edit environment… → save → Send
```

---

## Definition of done (MVP)

A developer who has never used Dakiya can:

1. Install / run the CLI  
2. Init a workspace  
3. Serve the dashboard  
4. Send a request with env vars  
5. Add a post-script in JS or TS and see env/response change  
6. Commit `.dakiya/` and have a teammate reproduce with `dakiya serve` only  

**Current:** All six steps work via CLI and web dashboard. Restart `dakiya serve` after `pnpm link:cli` to pick up API changes.
