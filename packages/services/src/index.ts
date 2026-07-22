import { hello as domainHello } from "@dakiya/domain"
import { parseDrq } from "@dakiya/format"

/** Layer 3 stub — real Workspace / Request services in Phase 2. */

export function greet(): string {
  const domain = domainHello()
  const format = parseDrq("")
  return [
    "Hello from @dakiya/services",
    `  ← ${domain.message}`,
    `  ← ${format.note}`,
  ].join("\n")
}
