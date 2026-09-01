<div align="center">
  <h3>📚 Dakiya Documentation</h3>
  <p>
    <a href="./Home.md">Home</a> •
    <a href="./Getting-Started.md">Getting Started</a> •
    <b>Collections & Requests</b> •
    <a href="./Environments.md">Environments</a> •
    <a href="./Scripts.md">Scripts</a> •
    <a href="./CLI.md">CLI Reference</a>
  </p>
</div>

<hr/>

# Collections & Requests

In Dakiya, your entire API surface is organized inside the `.dakiya/collections/` directory.

---

## 📁 Directory Structure

Collections map directly to real folders on your filesystem:

```
.dakiya/
  collections/
    auth/
      login/
        requests.yaml
        pre.ts
        post.ts
      register/
        requests.yaml
    users/
      list/
        requests.yaml
      get-by-id/
        requests.yaml
```

Each endpoint is a directory containing a `requests.yaml` file (and optional script files like `pre.ts` / `post.ts`).

---

## 📄 `requests.yaml` Format

Dakiya uses clean, readable YAML. A complete `requests.yaml` looks like this:

```yaml
version: "1.0.0"
name: "User Login"
description: "Authenticates a user and returns a session JWT token."

method: POST
url: "{{baseUrl}}/api/v1/auth/login"

headers:
  Content-Type: application/json
  Accept: application/json

body:
  type: json
  raw: |
    {
      "email": "{{userEmail}}",
      "password": "{{userPassword}}"
    }

# Optional example test cases
examples:
  - name: "Successful Login"
    request:
      body:
        raw: |
          {
            "email": "dev@example.com",
            "password": "secretPassword123"
          }
```

### Supported Body Types
- `none`: No payload sent (common for `GET` or `DELETE`).
- `json`: JSON payload (supports `{{variable}}` substitution).
- `raw`: Plaintext or custom formats.
- `form-data` / `x-www-form-urlencoded`: Key-value pairs for form submissions.
- `graphql`: GraphQL query and variables.

---

## 🛠️ Managing Requests

You can manage requests in three ways:

1. **Direct File Editing**: Open and edit `requests.yaml` in your favorite code editor (VSCode, Neovim, Zed).
2. **Web Dashboard**: Use `dakiya serve` to edit endpoints via the interactive UI.
3. **CLI**: Run endpoints with `dakiya run <folder>/<endpoint>` directly from the terminal.

---

<div align="space-between">
  <span><a href="./Getting-Started.md">← Previous: Getting Started</a></span>
  <span style="float: right;"><b>Next:</b> <a href="./Environments.md">Environments →</a></span>
</div>
