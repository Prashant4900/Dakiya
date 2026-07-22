/** Shared domain types — Zod models land later in Phase 1. */

export const DOMAIN_VERSION = "0.0.0"

export type HelloMessage = {
  package: "@dakiya/domain"
  message: string
}

export function hello(): HelloMessage {
  return {
    package: "@dakiya/domain",
    message: "Hello from @dakiya/domain",
  }
}

export type { WorkspaceManifest } from "./workspace.js"
export { WORKSPACE_MANIFEST_VERSION } from "./workspace.js"

export type { Environment, EnvironmentVariables } from "./environment.js"

export type {
  HttpMethod,
  HttpRequestLine,
  RequestDocument,
  RequestMeta,
  ResolvedHttpRequest,
  SendResult,
} from "./request.js"
