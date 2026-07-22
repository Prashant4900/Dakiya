import type { ResolvedHttpRequest, SendResult } from "@dakiya/domain"

export type HttpClient = {
  send(request: ResolvedHttpRequest): Promise<SendResult>
}

/** Default HttpClient using global `fetch` (Node 20+ / browsers). */
export function createFetchHttpClient(): HttpClient {
  return {
    async send(request) {
      const started = Date.now()
      const init: RequestInit = {
        method: request.method,
        headers: request.headers,
      }
      if (
        request.body !== undefined &&
        request.method !== "GET" &&
        request.method !== "HEAD"
      ) {
        init.body = request.body
      }

      const res = await fetch(request.url, init)
      const body = await res.text()
      const headers: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        headers[key] = value
      })

      return {
        status: res.status,
        statusText: res.statusText,
        headers,
        body,
        durationMs: Date.now() - started,
      }
    },
  }
}
