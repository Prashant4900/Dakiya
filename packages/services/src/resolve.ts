import type {
  EnvironmentVariables,
  RequestDocument,
  ResolvedHttpRequest,
} from "@dakiya/domain"
import { resolveRecord, resolveVars } from "./vars.js"

/** Apply environment variables to a parsed request document. */
export function resolveRequest(
  doc: RequestDocument,
  variables: EnvironmentVariables
): ResolvedHttpRequest {
  return {
    method: doc.request.method,
    url: resolveVars(doc.request.url, variables),
    headers: resolveRecord(doc.request.headers, variables),
    ...(doc.body !== undefined
      ? { body: resolveVars(doc.body, variables) }
      : {}),
  }
}
