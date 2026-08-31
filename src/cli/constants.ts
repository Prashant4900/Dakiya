import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Directory of the currently executing CLI file.
 * When bundled, this is `dist/cli`.
 */
export const CLI_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Root directory of the Dakiya repository.
 * Resolves to the directory containing package.json and vite.config.ts.
 */
export const PACKAGE_ROOT = path.resolve(CLI_DIR, "../../");

/** Default port for the Dakiya dashboard and API. */
export const DEFAULT_PORT = 4242;

/**
 * Resolve and validate the web root for serving the dashboard.
 * @throws Error if package.json is not found in the resolved root.
 */
export function resolveWebRoot(): string {
	const pkg = path.join(PACKAGE_ROOT, "package.json");

	if (!fs.existsSync(pkg)) {
		throw new Error(
			`Could not find Dakiya root at ${PACKAGE_ROOT}. Run from the Dakiya repository (pnpm link --global).`,
		);
	}

	return PACKAGE_ROOT;
}
