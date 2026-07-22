/**
 * Layer 3 — workspace / env / send orchestration.
 * No Node/React imports; callers inject fs + optional HttpClient.
 */

export { parseSimpleYaml } from "./yaml.js"
export { resolveVars, resolveRecord } from "./vars.js"
export { parseWorkspaceManifest } from "./workspace.js"
export { parseEnvironment } from "./environment.js"
export { resolveRequest } from "./resolve.js"
export { createFetchHttpClient } from "./http.js"
export type { HttpClient } from "./http.js"
export { sendRequest } from "./request.js"
export type { SendRequestOptions, SendRequestResult } from "./request.js"

import { hello as domainHello } from "@dakiya/domain"

/** Skeleton hello — kept for `dakiya hello`. */
export function greet(): string {
  const domain = domainHello()
  return ["Hello from @dakiya/services", `  ← ${domain.message}`].join("\n")
}
