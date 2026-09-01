---
name: architecture-package-evaluation
description: Guidelines for choosing between custom code and third-party packages in Dakiya
---

# Architecture Guidelines (Package vs. Custom Code)

When working on features for Dakiya, strictly follow the "Middle Ground" approach regarding dependencies based on the environment boundary:

### 1. Environment Boundaries
- `src/core`: **Strictly Isomorphic**. Must run in Node AND Browser. Zero native Node APIs (`fs`, `path`, etc.) allowed. Evaluate packages strictly on bundle size and browser compatibility.
- `src/cli`: **Node.js Only**. Native Node APIs are encouraged. Evaluate packages based on maintenance burden vs. adding a dependency.
- `src/web`: **Browser Only**. Web standard APIs only.

### 2. Dependency Evaluation
- **Do not blindly default** to custom code or heavy npm packages.
- **Evaluate Dependencies**: Before adding a new npm package, evaluate it for:
   - **Isomorphism**: Does it break the environment boundary?
   - **Size**: Is it lightweight, or will it bloat the browser bundle?
- **Discuss Tradeoffs**: Always present the pros and cons of an npm package vs. writing custom code to the user.

### 3. Decision Matrix
- If a package is lightweight, solves a complex problem well, and runs natively in the target environment, **propose using the package**.
- If the logic requires interacting with the file system or low-level networking in isomorphic code, **write custom wrappers** that inject platform-specific adapters (Node vs Browser).
