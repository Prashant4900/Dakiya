<div align="center">
  <h3>📚 Dakiya Documentation</h3>
  <p>
    <b>Home</b> •
    <a href="./Getting-Started.md">Getting Started</a> •
    <a href="./Collections.md">Collections & Requests</a> •
    <a href="./Environments.md">Environments</a> •
    <a href="./Scripts.md">Scripts</a> •
    <a href="./CLI.md">CLI Reference</a>
  </p>
</div>

<hr/>

# What is Dakiya?

**Dakiya** is a local-first API toolkit designed specifically for developers who prefer living in their code editors and terminals.

Unlike heavy, cloud-based applications (like Postman or Insomnia), Dakiya stores everything locally in your repository in clean, human-readable YAML files.

---

## 🎯 The Philosophy

1. **Git is the Source of Truth.**
   Your API requests should be version controlled alongside your codebase. Dakiya stores collections as `requests.yaml` files inside a `.dakiya/` directory, meaning pull requests, branching, and team syncs happen naturally via Git.
   
2. **Terminal First, GUI Second.**
   Dakiya provides a powerful command-line interface (`dakiya run`) for executing and scripting requests, and a beautiful web dashboard (`dakiya serve`) for visual editing and discovery. Both tap into the exact same local files.

3. **Scripting without limitations.**
   Instead of learning a proprietary DSL, Dakiya lets you write pre-request and post-response scripts in standard **TypeScript** or **JavaScript**. You can assert response structures, extract tokens, or seed databases securely within a Node.js sandbox.

---

<div align="right">
  <b>Next:</b> <a href="./Getting-Started.md">Getting Started →</a>
</div>
