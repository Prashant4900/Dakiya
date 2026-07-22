import { greet } from "@dakiya/services"

export function runHello(): string {
  return [
    "Dakiya skeleton — hello from apps/cli",
    "",
    greet(),
    "",
    "Next: see docs/phases.md (Phase 1 — domain + .drq format)",
  ].join("\n")
}
