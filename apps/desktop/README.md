# apps/desktop

Reserved for the **Tauri** desktop shell.

Same category as `apps/cli` and `apps/web`: a **delivery surface**. Shared logic stays in `packages/`.

## Status

Not started. MVP ships CLI + web only.

When we build this:

1. Wrap `@dakiya/web` in a Tauri window
2. Add Layer 4 adapters (`FsClient` via `invoke`) — do not fork business logic
3. Same `.dakiya/` format as CLI/web

See [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) and [docs/phases.md](../../docs/phases.md) Phase 6.
