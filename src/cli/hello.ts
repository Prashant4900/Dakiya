import { greet } from "@core/services";

export function runHello(): string {
	return [
		"Dakiya skeleton — hello from src/cli",
		"",
		greet(),
		"",
		"Next: see docs/phases.md (CLI list/run → Hono → web)",
	].join("\n");
}
