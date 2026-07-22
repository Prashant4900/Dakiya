import * as fs from "node:fs"
import { parseDrq } from "@dakiya/format"
import { sendRequest } from "@dakiya/services"
import {
  loadActiveEnvironment,
  requireWorkspace,
  resolveRequestFile,
} from "../workspace.js"

function formatBody(body: string, contentType: string | undefined): string {
  if (!body) return "(empty)"
  if (contentType?.includes("application/json")) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }
  return body
}

/** Load a `.drq`, resolve env vars, send HTTP, print the response. */
export async function runRun(requestArg: string | undefined): Promise<void> {
  if (!requestArg) {
    console.error(`[dakiya] Usage: dakiya run <path>`)
    console.error(`[dakiya] Example: dakiya run health/health`)
    process.exitCode = 1
    return
  }

  requireWorkspace()
  const env = loadActiveEnvironment()
  const { absPath, relativeToDakiya } = resolveRequestFile(requestArg)
  const source = fs.readFileSync(absPath, "utf8")
  const document = parseDrq(source, relativeToDakiya)

  console.log(`[dakiya] ${document.meta.name}  (${relativeToDakiya})`)
  console.log(`[dakiya] Env: ${env.name}`)

  const { resolved, response } = await sendRequest({
    document,
    variables: env.variables,
  })

  console.log("")
  console.log(`→ ${resolved.method} ${resolved.url}`)
  for (const [key, value] of Object.entries(resolved.headers)) {
    console.log(`  ${key}: ${value}`)
  }
  if (resolved.body) {
    console.log("")
    console.log(resolved.body)
  }

  console.log("")
  console.log(
    `← ${response.status} ${response.statusText}  (${response.durationMs}ms)`
  )
  for (const [key, value] of Object.entries(response.headers)) {
    console.log(`  ${key}: ${value}`)
  }
  console.log("")
  console.log(
    formatBody(response.body, response.headers["content-type"])
  )

  if (response.status >= 400) {
    process.exitCode = 1
  }
}
