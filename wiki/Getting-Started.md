<div align="center">
  <h3>📚 Dakiya Documentation</h3>
  <p>
    <a href="./Home.md">Home</a> •
    <b>Getting Started</b> •
    <a href="./Collections.md">Collections & Requests</a> •
    <a href="./Environments.md">Environments</a> •
    <a href="./Scripts.md">Scripts</a> •
    <a href="./CLI.md">CLI Reference</a>
  </p>
</div>

<hr/>

# Getting Started

Follow these steps to install Dakiya, initialize your project workspace, and start sending requests.

---

## 1. Installation

### Via Homebrew (Recommended)

Install directly using Homebrew:

```bash
brew install https://raw.githubusercontent.com/Prashant4900/Dakiya/main/Formula/dakiya.rb
```

Or via Homebrew Tap:

```bash
brew tap Prashant4900/dakiya https://github.com/Prashant4900/Dakiya
brew install dakiya
```

### From Source (for contributors)

```bash
git clone https://github.com/Prashant4900/Dakiya.git
cd Dakiya
pnpm install
pnpm build
```

---

## 2. Initialize a Workspace

Navigate to the root of your project directory and run:

```bash
dakiya init
```

This scaffolds a `.dakiya/` directory in your current workspace:
```
.dakiya/
  ├── dakiya.yaml         # Workspace configuration
  ├── environments/       # Local and production environment variables
  └── collections/        # Where your API requests live
```

---

## 3. Launch the Dashboard

Dakiya ships with a web dashboard for visually inspecting and running requests:

```bash
dakiya serve
```

Open `http://localhost:4242` in your browser. 
- Create new folders and requests using the sidebar.
- Everything edits your `.dakiya/collections/` directory in real-time.

---

## 4. Send a Request from the CLI

Once you've created a request (e.g. `health/health`), you can run it headlessly:

```bash
dakiya run health/health
```

Dakiya prints the response status, latency, headers, and payload directly to your terminal.

---

<div align="space-between">
  <span><a href="./Home.md">← Previous: What is Dakiya</a></span>
  <span style="float: right;"><b>Next:</b> <a href="./Collections.md">Collections & Requests →</a></span>
</div>
