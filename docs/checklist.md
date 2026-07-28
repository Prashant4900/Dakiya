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

## E. Web app (Phase 4)

- [ ] Sidebar shows folders + requests
- [ ] Select request loads editor
- [ ] Docs tab renders Markdown
- [ ] Scripts tab edits pre/post
- [ ] Examples tab shows samples
- [ ] Send shows status, timing, body, headers
- [ ] Env switch works
- [ ] Save persists to disk (verify in editor / git diff)
- [ ] No `localStorage` as source of truth for collections

---

## F. Ship MVP (Phase 5)

- [ ] README: install, init, serve, first request
- [ ] ABOUT.md / docs stay consistent
- [ ] Manual end-to-end on macOS (and ideally Linux)
- [ ] Fresh clone path verified
- [ ] Known limitations listed (no desktop, no Python, no import)

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

# Full path (once Phase 4 lands)
mkdir /tmp/dakiya-smoke && cd /tmp/dakiya-smoke
dakiya init
dakiya serve
# browser: open sample request, Send, check response
# edit .dakiya/collections/.../*.drq in an editor, refresh UI
# change env var, Send again
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

**Current:** Steps 1–2 and 4–5 work from CLI/API. Step 3 serves a placeholder UI until Phase 4.
