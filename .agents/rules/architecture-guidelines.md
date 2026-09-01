---
name: architecture-package-evaluation
description: Guidelines for choosing between custom code and third-party packages in Dakiya
---

# Architecture Guidelines (Package vs. Custom Code)

When working on features for Dakiya, especially within `src/core`, strictly follow the "Middle Ground" approach regarding dependencies:

1. **Do not blindly default** to custom code or heavy npm packages.
2. **Evaluate Dependencies**: Before adding a new npm package, evaluate it for:
   - **Isomorphism**: Does it rely on Node.js built-ins (`fs`, `path`, `http`)? If so, it CANNOT be used in `src/core` without breaking the Web Dashboard.
   - **Size**: Is it lightweight, or will it bloat the browser bundle?
3. **Discuss Tradeoffs**: Always present the pros and cons of an npm package vs. writing custom code to the user.
4. **Decision Matrix**:
   - If a package is lightweight, solves a complex problem well, and runs natively in both Node and browsers, **propose using the package**.
   - If the logic requires interacting with the file system or low-level networking, **write custom wrappers** that inject platform-specific adapters (Node vs Browser).
