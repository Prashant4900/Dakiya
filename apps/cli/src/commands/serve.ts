import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { createServer } from "vite"

const DEFAULT_PORT = 4242

/** Resolve monorepo `apps/web` from this file (`apps/cli/dist/commands/serve.js`). */
function resolveWebRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidate = path.resolve(here, "../../../web")
  const pkg = path.join(candidate, "package.json")

  if (!fs.existsSync(pkg)) {
    throw new Error(
      `Could not find @dakiya/web at ${candidate}. Run from the Dakiya monorepo (pnpm link:cli).`
    )
  }

  return candidate
}

/** Start the web dashboard (hello world) on localhost:4242. */
export async function runServe(port = DEFAULT_PORT): Promise<void> {
  const webRoot = resolveWebRoot()

  const server = await createServer({
    root: webRoot,
    configFile: path.join(webRoot, "vite.config.ts"),
    server: {
      port,
      strictPort: true,
      host: "localhost",
    },
  })

  await server.listen()

  const url = `http://localhost:${port}`
  console.log(`[dakiya] Serving dashboard at ${url}`)
  console.log(`[dakiya] Web root: ${webRoot}`)
  console.log(`[dakiya] Press Ctrl+C to stop`)
}
