import { listRequestPaths, loadManifest, requireWorkspace } from "../workspace.js"

/** Print the collection tree of `.drq` files. */
export function runList(): void {
  requireWorkspace()
  const manifest = loadManifest()
  const paths = listRequestPaths()

  console.log(`[dakiya] Workspace: ${manifest.name}`)
  if (manifest.defaultEnv) {
    console.log(`[dakiya] Default env: ${manifest.defaultEnv}`)
  }
  console.log("")

  if (paths.length === 0) {
    console.log("(no requests in .dakiya/collections)")
    return
  }

  console.log("Requests:")
  for (const p of paths) {
    console.log(`  ${p}`)
  }
}
