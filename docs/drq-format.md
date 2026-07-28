# `.drq` format cheat sheet

Dakiya stores HTTP requests as **`.drq`** files under `.dakiya/collections/`. One file = one request.

## Block overview

| Block | Required | Purpose |
|-------|----------|---------|
| `@meta` | Recommended | Name and type |
| `@request` | **Yes** | Method, URL, headers |
| `@body` | No | Request body |
| `@docs` | No | Markdown documentation |
| `@pre` | No | Script before send |
| `@post` | No | Script after send |
| `@example` | No | Sample response |
| `@assert` | No | Assertion source (execution deferred) |

Blocks are separated by a blank line. Unknown `@blocks` are ignored by the parser.

## Minimal example

```drq
@meta
name: Health
type: http

@request
GET {{baseUrl}}/api/health
```

## Variables

Use `{{name}}` in URL, headers, and body. Values come from `.dakiya/environments/<env>.yaml`:

```yaml
baseUrl: http://localhost:3000
token: abc123
```

## Scripts

```drq
@pre lang=js
req.setHeader("X-Request-Id", crypto.randomUUID())

@post lang=ts
if (res.status === 200) {
  env.set("token", res.json().accessToken, { persist: true })
}
```

- `lang=js` (default) or `lang=ts`
- Scripts run server-side in a sandbox on send
- `env.set(key, value, { persist: true })` writes back to the active environment YAML

### Script API (MVP)

| Object | Methods |
|--------|---------|
| `req` | `method`, `url`, `body`, `setHeader(name, value)` |
| `res` | `status`, `body`, `headers`, `json()` (post only) |
| `env` | `get(name)`, `set(name, value, opts?)`, `delete(name)` |

## Examples

```drq
@example Success
status: 200
response: @file(examples/auth/login-200.json)

@example Error
status: 401
response:
{
  "error": "unauthorized"
}
```

- `@file(path)` is relative to `.dakiya/`
- Inline `response:` may span multiple lines

## Asserts

```drq
@assert
res.status === 200
```

Stored in the model; execution is deferred in MVP.

## Normalize rules (round-trip)

- Line endings: `\n`
- Blocks emitted in order: meta → request → body → docs → pre → post → examples → asserts
- Trailing newline at EOF
- Empty optional blocks are omitted on serialize
