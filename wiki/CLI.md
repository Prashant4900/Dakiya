<div align="center">
  <h3>📚 Dakiya Documentation</h3>
  <p>
    <a href="./Home.md">Home</a> •
    <a href="./Getting-Started.md">Getting Started</a> •
    <a href="./Collections.md">Collections & Requests</a> •
    <a href="./Environments.md">Environments</a> •
    <a href="./Scripts.md">Scripts</a> •
    <b>CLI Reference</b>
  </p>
</div>

<hr/>

# CLI Reference

Dakiya features a fast, intuitive command-line interface powered by `cac`.

```bash
dakiya <command> [options]
```

---

## 💻 Commands

### `dakiya init`
Initializes a new `.dakiya/` workspace in the current working directory.
- Creates `.dakiya/dakiya.yaml`
- Sets up `.dakiya/environments/local.yaml`
- Creates an empty `.dakiya/collections/`

```bash
$ dakiya init
```

---

### `dakiya list`
Scans `.dakiya/collections/` and lists all discovered endpoints and requests in a readable tree format.

```bash
$ dakiya list
```

---

### `dakiya run <path>`
Sends an HTTP request for a specific endpoint path headlessly and displays the result in your terminal.

```bash
$ dakiya run auth/login
$ dakiya run users/list
```

---

### `dakiya serve`
Starts the local development server hosting the Web Dashboard and API.

```bash
$ dakiya serve
```

#### Options:
- `-p, --port <number>`: Specify a custom port (default: `4242`).

```bash
$ dakiya serve --port 8080
$ dakiya serve -p 3000
```

---

## ⚙️ Global Options

- `-h, --help`: Display help and command usage.
- `-v, --version`: Display the installed Dakiya version.

---

<div align="left">
  <a href="./Scripts.md">← Previous: Scripts</a>
</div>
