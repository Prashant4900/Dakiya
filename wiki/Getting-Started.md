# Getting Started

Follow these steps to initialize Dakiya in your project and start making API requests.

## 1. Installation

Dakiya is designed to be installed globally or via a local package runner. Currently, you can link it from source:

```bash
pnpm install
pnpm link:cli
```

*(Note: Once published to npm, you'll be able to install it via `npm install -g dakiya` or run it directly via `npx dakiya`)*

## 2. Initialize a Workspace

Navigate to the root of your project directory and run:

```bash
dakiya init
```

This will scaffold a `.dakiya/` directory in your current folder:
```
.dakiya/
  dakiya.yaml         # Workspace configuration
  environments/       # Local and production environment variables
  collections/        # Where your API requests will live
```

## 3. Launch the Dashboard

Dakiya ships with a beautiful web dashboard for editing your requests visually. 

```bash
dakiya serve
```

Open `http://localhost:4242` in your browser. 
- You can create new folders and requests using the sidebar.
- Requests are saved back to your `.dakiya/collections/` directory automatically.

## 4. Send a Request from the CLI

Once you've created a request (e.g., `health/health`), you can run it entirely headlessly:

```bash
dakiya run health/health
```

Dakiya will print the HTTP response, headers, and any script outputs directly to your terminal.

---
**Next:** Learn how [Collections](./Collections.md) are structured!
