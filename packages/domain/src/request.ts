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
 * Minimal request model for scaffold / early services.
 * Parser will populate docs, body, pre/post, examples later.
 */
export type RequestDocument = {
  /** Path relative to `.dakiya/`, e.g. `collections/hello/health.drq`. */
  relativePath: string
  meta: RequestMeta
  request: HttpRequestLine
  body?: string
}
