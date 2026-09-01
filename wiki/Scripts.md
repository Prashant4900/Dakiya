<div align="center">
  <h3>📚 Dakiya Documentation</h3>
  <p>
    <a href="./Home.md">Home</a> •
    <a href="./Getting-Started.md">Getting Started</a> •
    <a href="./Collections.md">Collections & Requests</a> •
    <a href="./Environments.md">Environments</a> •
    <b>Scripts</b> •
    <a href="./CLI.md">CLI Reference</a>
  </p>
</div>

<hr/>

# Pre & Post Request Scripts

Dakiya comes with a built-in, secure Node.js sandbox that allows you to execute custom **JavaScript** or **TypeScript** before a request is sent or after a response is received.

---

## 📂 File Placement

Scripts live right next to the corresponding `requests.yaml` in your collections folder:

```
.dakiya/collections/auth/login/
  ├── requests.yaml
  ├── pre.ts          # Runs BEFORE the request is dispatched
  └── post.ts         # Runs AFTER the response is received
```

You can scaffold these script files directly from the Web Dashboard using the **Create Script** button in the Pre-script / Post-script tabs.

---

## ⚡ Script Context & APIs

Inside `pre.ts` and `post.ts`, Dakiya exposes a global `dakiya` runtime helper object:

### `dakiya.env`
Read and write environment variables dynamically.

```typescript
// Read a variable
const token = dakiya.env.get("authToken");

// Set or update a variable
dakiya.env.set("lastUserId", "user_123");
```

### `dakiya.request` (in `pre.ts`)
Inspect or dynamically mutate outgoing request headers, URL, or body.

```typescript
// Add a dynamic timestamp or signature header
dakiya.request.headers["X-Timestamp"] = Date.now().toString();
```

### `dakiya.response` (in `post.ts`)
Inspect the HTTP response and parse payloads.

```typescript
// Parse JSON response and save auth token to environment
if (dakiya.response.status === 200) {
  const json = dakiya.response.json();
  dakiya.env.set("authToken", json.token);
  console.log("Token saved successfully!");
}
```

---

## 🔒 Safety & Sandboxing

Scripts are executed in an isolated Node.js `vm` sandbox. They do not leak global variables and are safely caught if runtime exceptions occur.

---

<div align="space-between">
  <span><a href="./Environments.md">← Previous: Environments & Variables</a></span>
  <span style="float: right;"><b>Next:</b> <a href="./CLI.md">CLI Reference →</a></span>
</div>
