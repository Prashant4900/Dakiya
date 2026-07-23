import * as fs from "node:fs";
import * as path from "node:path";
import type { Environment, WorkspaceManifest } from "@dakiya/domain";
import { parseEnvironment, parseWorkspaceManifest } from "@dakiya/services";

export function dakiyaDir(cwd = process.cwd()): string {
	return path.join(cwd, ".dakiya");
}

export function collectionsDir(cwd = process.cwd()): string {
	return path.join(dakiyaDir(cwd), "collections");
}

export function hasDakiyaWorkspace(cwd = process.cwd()): boolean {
	const dir = dakiyaDir(cwd);
	return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

export function hasDakiyaManifest(cwd = process.cwd()): boolean {
	const manifest = path.join(dakiyaDir(cwd), "dakiya.yaml");
	return fs.existsSync(manifest) && fs.statSync(manifest).isFile();
}

/** Require a usable `.dakiya/` + `dakiya.yaml`; exit with message if missing. */
export function requireWorkspace(cwd = process.cwd()): string {
	if (!hasDakiyaWorkspace(cwd) || !hasDakiyaManifest(cwd)) {
		console.error(`[dakiya] No workspace found in ${cwd}`);
		console.error(`[dakiya] Run \`dakiya init\` first.`);
		process.exit(1);
	}
	return dakiyaDir(cwd);
}

export function loadManifest(cwd = process.cwd()): WorkspaceManifest {
	const file = path.join(dakiyaDir(cwd), "dakiya.yaml");
	return parseWorkspaceManifest(fs.readFileSync(file, "utf8"));
}

export function loadActiveEnvironment(cwd = process.cwd()): Environment {
	const manifest = loadManifest(cwd);
	const envName = manifest.defaultEnv ?? "local";
	const file = path.join(dakiyaDir(cwd), "environments", `${envName}.yaml`);
	if (!fs.existsSync(file)) {
		throw new Error(`Environment not found: environments/${envName}.yaml`);
	}
	return parseEnvironment(envName, fs.readFileSync(file, "utf8"));
}

/** Recursively list `.drq` paths relative to `collections/`. */
export function listRequestPaths(cwd = process.cwd()): string[] {
	const root = collectionsDir(cwd);
	if (!fs.existsSync(root)) {
		return [];
	}

	const results: string[] = [];

	const walk = (dir: string) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const abs = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(abs);
				continue;
			}
			if (entry.isFile() && entry.name.endsWith(".drq")) {
				results.push(path.relative(root, abs).split(path.sep).join("/"));
			}
		}
	};

	walk(root);
	return results.sort();
}

/**
 * Resolve a CLI path arg to an absolute `.drq` file.
 * Accepts `health/health`, `health/health.drq`, or `collections/health/health.drq`.
 */
export function resolveRequestFile(
	arg: string,
	cwd = process.cwd(),
): { absPath: string; relativeToDakiya: string } {
	let cleaned = arg.trim().replace(/\\/g, "/");
	if (cleaned.startsWith("collections/")) {
		cleaned = cleaned.slice("collections/".length);
	}
	if (!cleaned.endsWith(".drq")) {
		cleaned = `${cleaned}.drq`;
	}

	const absPath = path.join(collectionsDir(cwd), cleaned);
	if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
		throw new Error(`Request not found: ${cleaned}`);
	}

	return {
		absPath,
		relativeToDakiya: path.posix.join("collections", cleaned),
	};
}
