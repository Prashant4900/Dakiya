# Dakiya

> *Dakiya (डाकिया) — the Hindi word for postman.*

Local-first API toolkit. **CLI + web dashboard first**; desktop optional later.

## Status

**Stage 1 — skeleton.** Docs and a hello-world monorepo. Full MVP is not built yet.

| Doc | Purpose |
|-----|---------|
| [ABOUT.md](./ABOUT.md) | Product vision |
| [docs/plan.md](./docs/plan.md) | MVP plan & decisions |
| [docs/phases.md](./docs/phases.md) | Implementation phases |
| [docs/checklist.md](./docs/checklist.md) | Hand-off / QA checklists |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical architecture |

## Install CLI (run `dakiya` anywhere)

The CLI is not on npm yet. Link it from this repo:

```bash
pnpm install
pnpm link:cli
```

Then in any directory:

```bash
dakiya init     # creates .dakiya/
dakiya serve    # http://localhost:4242 (hello-world web UI)
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
pnpm dakiya:serve
```


## Layout

```
packages/           — shared core (not user-facing)
  domain            — types
  format            — .drq parser
  services          — business logic

apps/               — delivery surfaces (interfaces)
  cli               — dakiya CLI + local server
  web               — browser dashboard
  desktop           — Tauri (reserved, not started)

example/
  server            — dummy Express API (`pnpm dev:example`) for local testing
```

## Dummy API (dev only)

```bash
pnpm dev:example   # http://localhost:3000 — see example/server/README.md
```

Not scaffolded by `dakiya init`. Point `.dakiya/environments/local.yaml` `baseUrl` at it when testing.

## Next

See [docs/phases.md](./docs/phases.md) — Phase 1 is domain + `.drq` format.
