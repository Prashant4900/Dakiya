import * as fs from "node:fs"
import * as path from "node:path"

const MANIFEST = "dakiya.yaml"
const LOCAL_ENV = path.join("environments", "local.yaml")

type ScaffoldFile = {
  relativePath: string
  content: string
}

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

function buildLocalEnv(): string {
  return [
    `# Local environment variables — use as {{name}} in requests`,
    `baseUrl: http://localhost:3000`,
    ``,
  ].join("\n")
}

/** Production-clean files for a fresh `.dakiya/` workspace (no sample requests). */
function scaffoldFiles(workspaceName: string): ScaffoldFile[] {
  return [
    { relativePath: MANIFEST, content: buildManifest(workspaceName) },
    { relativePath: LOCAL_ENV, content: buildLocalEnv() },
  ]
}

/**
 * Write a file only if missing. Creates parent directories as needed.
 * Returns true when a new file was written.
 */
function writeIfMissing(absPath: string, content: string): boolean {
  if (fs.existsSync(absPath)) {
    return false
  }
  fs.mkdirSync(path.dirname(absPath), { recursive: true })
  fs.writeFileSync(absPath, content, "utf8")
  return true
}

/**
 * Create / complete `.dakiya/` in the current directory:
 * manifest, empty collections/, and environments/local.yaml.
 * Existing files are left unchanged. No sample .drq files.
 */
export function runInit(): void {
  const cwd = process.cwd()
  const target = path.join(cwd, ".dakiya")
  const workspaceName = path.basename(cwd) || "workspace"
  const collectionsDir = path.join(target, "collections")

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true })
    console.log(`[dakiya] Created ${target}`)
  } else {
    console.log(`[dakiya] .dakiya already exists at ${target}`)
  }

  if (!fs.existsSync(collectionsDir)) {
    fs.mkdirSync(collectionsDir, { recursive: true })
    console.log(`[dakiya] Created ${collectionsDir}`)
  }

  let wrote = 0
  for (const file of scaffoldFiles(workspaceName)) {
    const abs = path.join(target, file.relativePath)
    if (writeIfMissing(abs, file.content)) {
      console.log(`[dakiya] Wrote ${abs}`)
      wrote++
    } else {
      console.log(`[dakiya] ${file.relativePath} already exists — left unchanged`)
    }
  }

  if (wrote === 0) {
    console.log(`[dakiya] Workspace already complete`)
  } else {
    console.log(`[dakiya] Scaffolded ${wrote} file(s) under ${target}`)
  }
}
