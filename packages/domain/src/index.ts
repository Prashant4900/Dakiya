/** Shared domain types — full Zod models land in Phase 1. */

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
