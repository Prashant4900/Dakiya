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

## 📦 Installation

### Via Homebrew (macOS / Linux)

Install directly with a single command:

```bash
brew install https://raw.githubusercontent.com/Prashant4900/Dakiya/main/Formula/dakiya.rb
```

Or tap this repository:

```bash
brew tap Prashant4900/dakiya https://github.com/Prashant4900/Dakiya
brew install dakiya
```

---

## ⚡ Quickstart

1. **Initialize a workspace in any project:**
   ```bash
   dakiya init
   ```

2. **Launch the web dashboard:**
   ```bash
   dakiya serve
   ```
   Open `http://localhost:4242` in your browser and start crafting requests!

3. **Run a request from your terminal:**
   ```bash
   dakiya run <folder>/<request>
   ```

---

## 📖 Wiki & Documentation

Dive into the [Wiki](./wiki/Home.md) for full documentation:

- [Getting Started](./wiki/Getting-Started.md) — Installation and your first request.
- [Collections & Requests](./wiki/Collections.md) — How the `.dakiya/` folder works.
- [Environments](./wiki/Environments.md) — Managing local vs production variables.
- [Sandbox Scripts](./wiki/Scripts.md) — Writing JS/TS to assert responses and chain requests.
- [CLI Reference](./wiki/CLI.md) — Full command-line API.

*(Internal project architecture and MVP engineering docs are in `docs/internal/`).*
