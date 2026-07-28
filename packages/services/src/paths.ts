/**
 * Pure path helpers for `.dakiya/` layout — no Node imports.
 */

export const DAKIYA_DIR = ".dakiya";
export const COLLECTIONS_DIR = "collections";
export const ENVIRONMENTS_DIR = "environments";
export const MANIFEST_FILE = "dakiya.yaml";

export function posixJoin(...segments: string[]): string {
	return segments
		.filter((segment) => segment.length > 0)
		.map((segment, index) => {
			if (index === 0) return segment.replace(/\/+$/g, "");
			return segment.replace(/^\/+|\/+$/g, "");
		})
		.join("/");
}

export function dakiyaRoot(cwd: string): string {
	return posixJoin(cwd, DAKIYA_DIR);
}

export function collectionsRoot(cwd: string): string {
	return posixJoin(dakiyaRoot(cwd), COLLECTIONS_DIR);
}

export function environmentsRoot(cwd: string): string {
	return posixJoin(dakiyaRoot(cwd), ENVIRONMENTS_DIR);
}

export function manifestPath(cwd: string): string {
	return posixJoin(dakiyaRoot(cwd), MANIFEST_FILE);
}

export function environmentPath(cwd: string, name: string): string {
	assertSafeName(name, "environment");
	return posixJoin(environmentsRoot(cwd), `${name}.yaml`);
}

/**
 * Normalize a collections-relative request path.
 * Accepts `health/health`, `health/health.drq`, or `collections/health/health.drq`.
 */
export function normalizeRequestPath(arg: string): string {
	let cleaned = arg.trim().replace(/\\/g, "/");
	if (cleaned.startsWith("/")) cleaned = cleaned.slice(1);
	if (cleaned.startsWith(`${COLLECTIONS_DIR}/`)) {
		cleaned = cleaned.slice(`${COLLECTIONS_DIR}/`.length);
	}
	if (!cleaned.endsWith(".drq")) {
		cleaned = `${cleaned}.drq`;
	}
	if (
		cleaned.includes("..") ||
		cleaned.startsWith("/") ||
		/^([A-Za-z]:|\/)/.test(cleaned)
	) {
		throw new Error(`Invalid request path: ${arg}`);
	}
	return cleaned;
}

export function resolveRequestPaths(
	arg: string,
	cwd: string,
): {
	absPath: string;
	relativeToDakiya: string;
	relativeToCollections: string;
} {
	const cleaned = normalizeRequestPath(arg);
	const collectionsRootPath = collectionsRoot(cwd);
	const absPath = posixJoin(collectionsRootPath, cleaned);

	if (!absPath.startsWith(`${collectionsRootPath}/`)) {
		throw new Error(`Invalid request path: ${arg}`);
	}

	return {
		absPath,
		relativeToDakiya: posixJoin(COLLECTIONS_DIR, cleaned),
		relativeToCollections: cleaned,
	};
}

function assertSafeName(name: string, kind: string): void {
	if (
		!name ||
		name.includes("..") ||
		name.includes("/") ||
		name.includes("\\")
	) {
		throw new Error(`Invalid ${kind} name: ${name}`);
	}
}
