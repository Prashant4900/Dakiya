<div align="center">
  <img src="./assets/logo.jpg" alt="Dakiya Logo" width="200" />
  <h1>Dakiya (डाकिया)</h1>
  <p><em>The Hindi word for Postman.</em></p>
  <p><strong>A modern, local-first API toolkit for developers. CLI-native, Git-friendly, and blazing fast.</strong></p>
</div>

<hr/>

Dakiya is a powerful alternative to traditional API testing clients (like Postman or Insomnia). It stores all your requests as simple YAML files locally in your repository, making them instantly version-controllable and readable.

With Dakiya, you get the power of a headless **CLI runner** combined with a beautiful **React-based Web Dashboard**.

## 🚀 Features
- **Local-first**: Everything lives in a `.dakiya/` folder in your repo.
- **Git-friendly**: Requests are saved in a clean `requests.yaml` format. No more massive JSON blobs or workspace sync conflicts.
- **CLI Native**: Run, test, and manage requests directly from your terminal.
- **Isomorphic Dashboard**: Run `dakiya serve` to spin up a beautiful web dashboard right from your CLI.
- **Sandbox Scripts**: Write pre-request and post-response scripts in standard JavaScript/TypeScript.

---

## 📖 Wiki & Documentation

Dive into the [Wiki](./wiki/Home.md) to master Dakiya:

- [Getting Started](./wiki/Getting-Started.md) — Installation and your first request.
- [Collections & Requests](./wiki/Collections.md) — How the `.dakiya/` folder works.
- [Environments](./wiki/Environments.md) — Managing local vs production variables.
- [Sandbox Scripts](./wiki/Scripts.md) — Writing JS/TS to assert responses and chain requests.
- [CLI Reference](./wiki/CLI.md) — Full command-line API.

*(Internal project architecture and MVP planning docs can be found in `docs/internal/`).*

---

## ⚡ Quickstart

Install the CLI globally (currently local via pnpm for dev):

```bash
pnpm install
pnpm link:cli
```

Initialize a workspace in any project:
```bash
dakiya init
```

Launch the web dashboard:
```bash
dakiya serve
```
Open `http://localhost:4242` in your browser and start building APIs!
