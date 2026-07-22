import type {
  EnvironmentVariables,
  RequestDocument,
  ResolvedHttpRequest,
  SendResult,
} from "@dakiya/domain"
import type { HttpClient } from "./http.js"
import { createFetchHttpClient } from "./http.js"
import { resolveRequest } from "./resolve.js"

export type SendRequestOptions = {
  document: RequestDocument
  variables: EnvironmentVariables
  http?: HttpClient
}

export type SendRequestResult = {
  resolved: ResolvedHttpRequest
  response: SendResult
}

/**
 * Resolve `{{vars}}` then send over HTTP.
 * Scripts (@pre / @post) are not run in this starter.
 */
export async function sendRequest(
  options: SendRequestOptions
): Promise<SendRequestResult> {
  const resolved = resolveRequest(options.document, options.variables)
  const http = options.http ?? createFetchHttpClient()
  const response = await http.send(resolved)
  return { resolved, response }
}
