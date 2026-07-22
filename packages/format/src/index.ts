/**
 * .drq parse / serialize — stub only.
 * Real lexer + round-trip land in Phase 1.
 */

export const FORMAT_VERSION = "0.0.0"

export type ParsedStub = {
  ok: true
  note: string
}

/** Placeholder: does not parse .drq yet. */
export function parseDrq(_source: string): ParsedStub {
  return {
    ok: true,
    note: "Hello from @dakiya/format — .drq parser not implemented yet",
  }
}

export function serializeDrqStub(): string {
  return `@meta
name: Hello
type: http

@request
GET {{baseUrl}}/api/health
`
}
