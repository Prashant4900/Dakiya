import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Directory of the currently executing CLI file.
 * When bundled, this is `dist/cli`.
 */
export const CLI_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Root directory of the built web distribution.
 * When bundled in dist/cli/cli.js, this resolves to dist/.
 */
export const DIST_DIR = path.resolve(CLI_DIR, "..");

/**
 * Root directory of the Dakiya repository.
 */
export const PACKAGE_ROOT = path.resolve(CLI_DIR, "../../");

/** Default port for the Dakiya dashboard and API. */
export const DEFAULT_PORT = 4242;

/**
 * Resolve and validate the web dist directory for serving the dashboard.
 */
export function resolveWebDistDir(): string {
	if (fs.existsSync(path.join(DIST_DIR, "index.html"))) {
		return DIST_DIR;
	}
	const rootDist = path.join(PACKAGE_ROOT, "dist");
	if (fs.existsSync(path.join(rootDist, "index.html"))) {
		return rootDist;
	}
	return DIST_DIR;
}
