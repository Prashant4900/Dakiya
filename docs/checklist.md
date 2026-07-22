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

- [ ] Parse `@meta`, `@request`, `@body`, `@docs`, `@pre`, `@post`, `@example`, `@assert`
- [ ] Serialize round-trip fixtures pass
- [ ] `@file(...)` example refs resolve or are preserved
- [ ] `lang=js` / `lang=ts` on script blocks stored in model
- [ ] Workspace + environment types in `@dakiya/domain`
- [ ] Format cheat sheet committed under `docs/`

---

## C. Services (Phase 2)

- [ ] Scaffold creates valid `.dakiya/` tree
- [ ] List collections as folder tree
- [ ] Variable substitution `{{name}}`
- [ ] Pre-script can set header / env
- [ ] Post-script can mutate body and persist env
- [ ] TS scripts execute (after transpile/strip)
- [ ] No React / Node imports inside `@dakiya/services`

---

## D. CLI app (Phase 3)

- [ ] `dakiya init` idempotent / clear errors if already present
- [ ] `dakiya list` shows collection tree
- [ ] `dakiya run <path>` sends request with env vars and prints response
- [ ] `dakiya serve --port 4242`
- [ ] `GET /api/health` → `{ status: "ok" }`
- [ ] CRUD request via API updates `.drq` on disk
- [ ] `POST /api/send` runs pre → HTTP → post
- [ ] Missing `.dakiya` returns clear error
- [ ] Port-in-use message is actionable

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
# from a temp project
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
