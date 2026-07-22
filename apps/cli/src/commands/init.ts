import * as fs from "node:fs"
import * as path from "node:path"

const MANIFEST = "dakiya.yaml"

/** Default workspace core manifest written to `.dakiya/dakiya.yaml`. */
function buildManifest(workspaceName: string): string {
  return [
    `# Dakiya workspace core — metadata for this project`,
    `name: ${workspaceName}`,
    `description: "A local-first API workspace for ${workspaceName}."`,
    ``,
    `version: 1`,
    ``,
    `# Active environment (matches a file under environments/)`,
    `defaultEnv: local`,
    ``,
  ].join("\n")
}

/** Create `.dakiya/` with a core `dakiya.yaml` manifest in the current directory. */
export function runInit(): void {
  const cwd = process.cwd()
  const target = path.join(cwd, ".dakiya")
  const manifestPath = path.join(target, MANIFEST)
  const workspaceName = path.basename(cwd) || "workspace"

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
    console.log(`[dakiya] Created ${target}`)
  } else {
    console.log(`[dakiya] .dakiya already exists at ${target}`)
  }

  if (fs.existsSync(manifestPath)) {
    console.log(`[dakiya] ${MANIFEST} already exists — left unchanged`)
    return
  }

  fs.writeFileSync(manifestPath, buildManifest(workspaceName), "utf8")
  console.log(`[dakiya] Wrote ${manifestPath}`)
}
