# Dakiya

> *Dakiya (डाकिया) — the Hindi word for postman. Someone who delivers your message, quietly, without making a fuss.*

---

## What is Dakiya?

Dakiya is a local-first API toolkit for developers — a personal messenger that sends requests to servers and shows you exactly what comes back.

If you have ever used Postman, Insomnia, or Swagger UI, you already know the job. Dakiya does it differently: **everything stays on your machine**, stored as plain files in your project. No account. No cloud sync. No subscription. No Dakiya servers between you and your API.

You can use Dakiya in three ways:

| Surface | Best for |
|---------|----------|
| **CLI** | Init a project, serve a local dashboard, scriptable workflows |
| **Web dashboard** | Browser-based API testing — Swagger-like, no desktop install |
| **Desktop app** | Full native experience on macOS, Windows, and Linux |

All three read and write the same **`.dakiya`** folder. Pick the surface that fits your workflow; the data stays interchangeable.

---

## Three ways to use Dakiya

### 1. CLI — init and serve (Swagger-like workflow)

The CLI is the entry point for teams who live in the terminal. No desktop app required.

```bash
# Inside your project — creates .dakiya/ with collections, envs, manifest
dakiya init

# Serves the web dashboard locally (e.g. http://localhost:4242)
dakiya serve
```

**Closest comparison: Swagger UI.** You define your API collection as files, run a local server, and explore and send requests from the browser. The difference: your collection lives in `.dakiya/` inside the repo — versioned with Git, editable in any editor — not buried in a framework-specific annotation layer.

Typical flow:

1. Clone a repo that already has `.dakiya/` (or run `dakiya init` once).
2. Run `dakiya serve`.
3. Open the local URL in any browser.
4. Send requests, switch environments, inspect responses — same as the desktop app.

### 2. Web dashboard — browser UI, local server

The web dashboard is the React UI served by the CLI (or embedded in dev workflows). It is **not** a hosted SaaS — it runs on `localhost` and reads your project's `.dakiya` files directly.

Use it when you:

- Don't want to install the desktop app
- Prefer a browser tab during backend development
- Want CI or docs to point at a standard local URL
- Need a lightweight option for teammates on any OS

### 3. Desktop app — full native client

The Tauri desktop app is the premium experience: native window, offline shell, system integrations, and scoped OS permissions. It uses the **same UI, services, and `.dakiya` format** as the web dashboard — only the infrastructure layer differs (Tauri FS/SQLite vs Node FS/SQLite).

Install once, link projects, work without a terminal. Ideal for daily driver use.

---

## Why does Dakiya exist?

Most API tools today are moving in the wrong direction. They want you to sign up, sync your data to their cloud, upgrade to a paid plan, and depend on their servers just to send a simple HTTP request.

That feels wrong.

An API client is a developer tool — it should feel like a text editor or a terminal. You open it, you use it, you close it. It should not need your email address to do its job.

Dakiya was built around one simple idea: **your work belongs to you, on your machine, always.**

---

## Who is it for?

Dakiya is built for developers who —

- Are tired of being forced to create accounts just to use a tool
- Work in environments where sending data to external clouds is not allowed
- Want a fast, no-distraction API client that just works
- Prefer owning their data locally rather than trusting it to someone else's server
- Are looking for a lightweight alternative to bloated tools

Whether you are a solo developer, part of a startup, or working inside a company with strict data policies — Dakiya fits in without asking for anything in return.

---

## What can you do with Dakiya?

- Send HTTP requests — GET, POST, PUT, PATCH, DELETE and more
- Organize requests into collections, just like folders — **create, rename, delete, and move** from the sidebar
- Write and edit request bodies with a clean built-in editor (JSON, form-data, urlencoded, GraphQL, binary)
- Manage request headers with a key-value editor and environment-variable highlighting
- View responses with proper formatting — JSON, HTML, plain text
- Save work locally in `.dakiya/` and pick up where you left off
- **Version switcher** — add `versions:` to `dakiya.yaml` to filter your collection by API version
- **`dakiya init`** — scaffold the full `.dakiya` layout in any project
- **`dakiya serve`** — launch a local web dashboard (no desktop app needed)
- Pre/post scripts in JS or TS — scaffold from the dashboard, edit in your code editor
- Use the **desktop app** when you want a native, always-available client
- Work offline — the CLI, dashboard, and desktop app all run locally

---

## The `.dakiya` folder — lives inside your project

This is what makes Dakiya different from every other API tool out there.

When you link a project — via **`dakiya init`**, the desktop app, or manually — Dakiya uses a `.dakiya` folder inside that project's directory. This folder holds everything: API requests, collections, environments, variables, and workspace configuration.

**One format, every surface.** The CLI, web dashboard, and desktop app all read and write the same files. Init with the CLI, tweak files in your editor, serve the dashboard for a teammate, or open the desktop app later — nothing syncs to the cloud; the folder *is* the source of truth.

**What this means in practice:**

**Your API collection travels with your code.**
No more exporting a Postman collection, attaching it to a Slack message, and hoping your teammate imports the right version. The `.dakiya` folder sits inside your repo. When someone clones the project, they run `dakiya serve` and start testing — no desktop install, no import step.

**Your team always stays in sync.**
Since the `.dakiya` folder is just files on disk, it works naturally with Git. Commit it, branch it, review it in a pull request. Every API change is tracked alongside the code that caused it — the way it always should have been.

**Swagger-like, but repo-native.**
Swagger UI reads an OpenAPI spec and gives you a try-it-out panel. Dakiya gives you the same *working flow* — local server, browser UI, send requests — but your collection is first-class project data in `.dakiya/`, not generated from code or locked to one framework.

**Import anywhere, anytime.**
Share the `.dakiya` folder on its own, or share the whole repo. Anyone with the CLI (`dakiya serve`) or the desktop app can use it immediately.

**Readable and editable by anything.**
The files inside `.dakiya` are plain, human-readable files. Developers can open them in any editor — add an endpoint, update a base URL, tweak an environment variable — without opening Dakiya. AI coding assistants can read and update these files too, keeping your API collection in sync as your codebase evolves.

---

## What Dakiya will never do

- Ask you to create an account
- Sync your data to any cloud server
- Host your collections on Dakiya-operated infrastructure
- Show you ads or upsell you to a paid plan
- Collect usage data or analytics without your knowledge
- Stop working because our servers went down — there are no Dakiya servers in your workflow

---

## The name

*Dakiya* is the Hindi word for the person who delivers your letters — the postman. Just like a postman carries your message from one place to another without reading it or storing a copy, Dakiya carries your API requests to wherever they need to go, without holding on to anything.

It is a small nod to Indian roots, and a reminder that the best tools are the ones that simply do their job and stay out of your way.

---

## Current Status

Dakiya is actively in development. **MVP is complete** — Phases 0–5 (shared core, CLI, local API, web dashboard, polish). **Phase 6 (desktop)** is optional and deferred until there is market demand.

| Surface | Status |
|---------|--------|
| **Shared core** (`domain`, `format`, `services`) | Done — Zod types, `.drq` parse/serialize, send pipeline, tests |
| **CLI** | Done — `init`, `list`, `run`, `serve`, Hono `/api/*`, script sandbox |
| **Web dashboard** | Done — sidebar tree (with CRUD, move, version switcher), Body/Headers/Docs/Scripts/Examples tabs, env switcher, file upload, send/save via API |
| **Desktop app** | Reserved stub (Tauri, later) |

All surfaces share the same `.dakiya` file format and core logic. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [docs/phases.md](./docs/phases.md).

---

## Related documents

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Four-layer model, CLI/server/desktop split, packages
- [docs/plan.md](./docs/plan.md) — MVP plan and product decisions
- [docs/phases.md](./docs/phases.md) — Implementation phases
- [docs/checklist.md](./docs/checklist.md) — Hand-off and QA checklists
- [docs/drq-format.md](./docs/drq-format.md) — `.drq` format cheat sheet

---

*Built with love for developers who value simplicity and privacy.*