/**
 * Parsed HTTP request — maps to a single `.drq` file under `.dakiya/collections/`.
 * Full block model (docs, scripts, examples) expands with the `.drq` parser.
 */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"

export type RequestMeta = {
  name: string
  type: "http"
}

export type HttpRequestLine = {
  method: HttpMethod
  url: string
  headers: Record<string, string>
}

/**
 * Minimal request model for CLI run / early services.
 * @pre / @post / @example / @assert are ignored by the MVP parser.
 */
export type RequestDocument = {
  /** Path relative to `.dakiya/`, e.g. `collections/hello/health.drq`. */
  relativePath: string
  meta: RequestMeta
  request: HttpRequestLine
  body?: string
  docs?: string
}

/** Resolved request ready to send (vars already substituted). */
export type ResolvedHttpRequest = {
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: string
}

export type SendResult = {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  /** Wall time in milliseconds. */
  durationMs: number
}
