# Dakiya

> *Dakiya (डाकिया) — the Hindi word for postman.*

Local-first API toolkit. **CLI + web dashboard first**; desktop optional later.

## Status

**Stage 2 — core complete.** Phases 0–2 done; Phase 3 (CLI + local API) largely built. **Next:** Phase 4 web dashboard.

| Phase | Status |
|-------|--------|
| 0 — Skeleton | Done |
| 1 — Domain + `.drq` format | Done |
| 2 — Services | Done |
| 3 — CLI + API | ~90% (uncommitted polish may remain) |
| 4 — Web dashboard | Not started (placeholder UI) |
| 5 — Ship MVP | Not started |

Run tests: `pnpm test` · Format reference: [docs/drq-format.md](./docs/drq-format.md)

| Doc | Purpose |
|-----|---------|
| [ABOUT.md](./ABOUT.md) | Product vision |
| [docs/plan.md](./docs/plan.md) | MVP plan & decisions |
| [docs/phases.md](./docs/phases.md) | Implementation phases |
| [docs/checklist.md](./docs/checklist.md) | Hand-off / QA checklists |
| [docs/drq-format.md](./docs/drq-format.md) | `.drq` format cheat sheet |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical architecture |

## Install CLI (run `dakiya` anywhere)

The CLI is not on npm yet. Link it from this repo:

```bash
pnpm install
pnpm link:cli
```

Then in any directory:

```bash
dakiya init              # creates .dakiya/
dakiya list              # list .drq requests
dakiya run health/health # send a request (needs API up)
dakiya serve             # http://localhost:4242 (hello-world web UI)
dakiya --help
```

Unlink later:

```bash
pnpm unlink:cli
```

**Note:** After pulling code changes, rebuild + re-link: `pnpm link:cli`.

### Without global link

```bash
pnpm dakiya:init
pnpm --filter @dakiya/cli run list
pnpm --filter @dakiya/cli exec node dist/cli.js run health/health
pnpm dakiya:serve
```

## Dummy API (dev only)

```bash
pnpm dev:example   # http://localhost:3000 — see example/server/README.md
```

In this repo, `.dakiya/collections/` already has requests aimed at that server. With the example API running:

```bash
pnpm --filter @dakiya/cli run list
pnpm --filter @dakiya/cli exec node dist/cli.js run health/health
```

Not scaffolded by `dakiya init`. Point `.dakiya/environments/local.yaml` `baseUrl` at it when testing.

## Layout

```
packages/           — shared core (not user-facing)
  domain            — Zod schemas + types
  format            — .drq parse / serialize
  services          — business logic (FsClient, workspace, send)

apps/               — delivery surfaces (interfaces)
  cli               — dakiya CLI + Hono API + script sandbox
  web               — browser dashboard (placeholder)
  desktop           — Tauri (reserved, not started)

example/
  server            — dummy Express API (`pnpm dev:example`) for local testing
```

## Next

See [docs/phases.md](./docs/phases.md) — **Phase 4:** wire `apps/web` to the local `/api/*` endpoints.
