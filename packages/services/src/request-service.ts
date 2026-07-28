import type { FsClient } from "./fs-client.js";
import { collectionsRoot, resolveRequestPaths } from "./paths.js";

/** Recursively list `.drq` paths relative to `collections/`. */
export function listRequestPaths(fs: FsClient, cwd: string): string[] {
	const root = collectionsRoot(cwd);
	if (!fs.exists(root)) {
		return [];
	}

	const results: string[] = [];

	const walk = (dir: string, prefix = "") => {
		for (const entry of fs.readDir(dir)) {
			const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
			const abs = `${dir}/${entry.name}`;
			if (entry.isDirectory) {
				walk(abs, rel);
				continue;
			}
			if (entry.isFile && entry.name.endsWith(".drq")) {
				results.push(rel);
			}
		}
	};

	walk(root);
	return results.sort();
}

export function readRequestSource(
	fs: FsClient,
	arg: string,
	cwd: string,
): {
	source: string;
	relativeToDakiya: string;
	relativeToCollections: string;
} {
	const resolved = resolveRequestPaths(arg, cwd);
	if (!fs.exists(resolved.absPath)) {
		throw new Error(`Request not found: ${resolved.relativeToCollections}`);
	}
	return {
		source: fs.readFile(resolved.absPath),
		relativeToDakiya: resolved.relativeToDakiya,
		relativeToCollections: resolved.relativeToCollections,
	};
}

export function writeRequestSource(
	fs: FsClient,
	arg: string,
	source: string,
	cwd: string,
	options?: { createOnly?: boolean },
): { relativeToCollections: string; created: boolean } {
	const resolved = resolveRequestPaths(arg, cwd);
	const exists = fs.exists(resolved.absPath);
	if (options?.createOnly && exists) {
		throw new Error(
			`Request already exists: ${resolved.relativeToCollections}`,
		);
	}
	if (!options?.createOnly && !exists) {
		throw new Error(`Request not found: ${resolved.relativeToCollections}`);
	}

	const parent = resolved.absPath.slice(0, resolved.absPath.lastIndexOf("/"));
	if (parent && !fs.exists(parent)) {
		fs.mkdir(parent);
	}
	fs.writeFile(resolved.absPath, source);
	return {
		relativeToCollections: resolved.relativeToCollections,
		created: !exists,
	};
}

export function deleteRequestFile(
	fs: FsClient,
	arg: string,
	cwd: string,
): void {
	const resolved = resolveRequestPaths(arg, cwd);
	if (!fs.exists(resolved.absPath)) {
		throw new Error(`Request not found: ${resolved.relativeToCollections}`);
	}
	fs.removeFile(resolved.absPath);
}
