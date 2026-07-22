# @example/server

Dummy Express API for local Dakiya development. Not part of the product CLI.

```bash
pnpm --filter @example/server start
# or with reload:
pnpm --filter @example/server dev
```

Default: `http://localhost:3000` (override with `PORT=`).

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | `{ status: "ok" }` |
| GET | `/api/echo` | Echo query + a few headers |
| POST | `/api/echo` | Echo JSON body |
| GET | `/api/users` | List in-memory users |
| GET | `/api/users/:id` | One user |
| POST | `/api/users` | `{ "name", "email" }` → 201 |
| PUT | `/api/users/:id` | Partial update |
| DELETE | `/api/users/:id` | 204 |
