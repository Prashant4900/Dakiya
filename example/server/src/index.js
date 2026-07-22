import express from "express"

const PORT = Number(process.env.PORT) || 3000

const app = express()
app.use(express.json())

/** In-memory store for a tiny CRUD surface. */
const users = new Map([
  [1, { id: 1, name: "Ada", email: "ada@example.com" }],
  [2, { id: 2, name: "Grace", email: "grace@example.com" }],
])
let nextId = 3

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "@example/server" })
})

app.get("/api/echo", (req, res) => {
  res.json({
    method: req.method,
    query: req.query,
    headers: {
      "content-type": req.get("content-type") ?? null,
      "x-request-id": req.get("x-request-id") ?? null,
    },
  })
})

app.post("/api/echo", (req, res) => {
  res.status(201).json({
    method: req.method,
    body: req.body,
    headers: {
      "content-type": req.get("content-type") ?? null,
      "x-request-id": req.get("x-request-id") ?? null,
    },
  })
})

app.get("/api/users", (_req, res) => {
  res.json({ users: [...users.values()] })
})

app.get("/api/users/:id", (req, res) => {
  const id = Number(req.params.id)
  const user = users.get(id)
  if (!user) {
    res.status(404).json({ error: "user_not_found", id })
    return
  }
  res.json(user)
})

app.post("/api/users", (req, res) => {
  const { name, email } = req.body ?? {}
  if (typeof name !== "string" || typeof email !== "string") {
    res.status(400).json({ error: "name_and_email_required" })
    return
  }
  const user = { id: nextId++, name, email }
  users.set(user.id, user)
  res.status(201).json(user)
})

app.put("/api/users/:id", (req, res) => {
  const id = Number(req.params.id)
  const existing = users.get(id)
  if (!existing) {
    res.status(404).json({ error: "user_not_found", id })
    return
  }
  const { name, email } = req.body ?? {}
  const user = {
    id,
    name: typeof name === "string" ? name : existing.name,
    email: typeof email === "string" ? email : existing.email,
  }
  users.set(id, user)
  res.json(user)
})

app.delete("/api/users/:id", (req, res) => {
  const id = Number(req.params.id)
  if (!users.has(id)) {
    res.status(404).json({ error: "user_not_found", id })
    return
  }
  users.delete(id)
  res.status(204).end()
})

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" })
})

app.listen(PORT, "localhost", () => {
  console.log(`[@example/server] listening on http://localhost:${PORT}`)
  console.log(`[@example/server] try GET /api/health  /api/users  POST /api/echo`)
})
