import type { WorkspaceManifest } from "@dakiya/domain";
import type { FsClient } from "./fs-client.js";
import {
	COLLECTIONS_DIR,
	dakiyaRoot,
	manifestPath,
	posixJoin,
} from "./paths.js";
import { type ScaffoldResult, scaffoldFiles } from "./scaffold.js";
import { parseWorkspaceManifest } from "./workspace.js";

export function hasWorkspace(fs: FsClient, cwd: string): boolean {
	const root = dakiyaRoot(cwd);
	return fs.exists(root);
}

export function hasManifest(fs: FsClient, cwd: string): boolean {
	return fs.exists(manifestPath(cwd));
}

export function loadManifest(fs: FsClient, cwd: string): WorkspaceManifest {
	const file = manifestPath(cwd);
	if (!fs.exists(file)) {
		throw new Error(`Workspace manifest not found: ${file}`);
	}
	return parseWorkspaceManifest(fs.readFile(file));
}

/**
 * Create / complete `.dakiya/` in cwd.
 * Existing files are left unchanged. No sample .drq files.
 */
export function scaffoldWorkspace(
	fs: FsClient,
	cwd: string,
	workspaceName: string,
): ScaffoldResult {
	const root = dakiyaRoot(cwd);
	const created: string[] = [];
	const skipped: string[] = [];

	if (!fs.exists(root)) {
		fs.mkdir(root);
	}

	const collectionsDir = posixJoin(root, COLLECTIONS_DIR);
	if (!fs.exists(collectionsDir)) {
		fs.mkdir(collectionsDir);
		created.push(COLLECTIONS_DIR);
	}

	for (const file of scaffoldFiles(workspaceName)) {
		const abs = posixJoin(root, file.relativePath);
		if (fs.exists(abs)) {
			skipped.push(file.relativePath);
			continue;
		}
		const parent = abs.slice(0, abs.lastIndexOf("/"));
		if (parent && !fs.exists(parent)) {
			fs.mkdir(parent);
		}
		fs.writeFile(abs, file.content);
		created.push(file.relativePath);
	}

	return { created, skipped };
}
