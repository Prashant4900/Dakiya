import * as path from "node:path";
import { scaffoldWorkspace } from "@core/services";
import { createNodeFsClient } from "../fs/node-fs-client.js";

const fs = createNodeFsClient();

/**
 * Create * Scaffold a new `.dakiya/` workspace in the current directory, complete with
 * manifest, empty collections/, and environments/local.json.
 * Existing files are left unchanged. No sample requests.yaml files.
 */
export function runInit(): void {
	const cwd = process.cwd();
	const workspaceName = path.basename(cwd) || "workspace";
	const target = path.join(cwd, ".dakiya");

	const hadWorkspace = fs.exists(target);
	if (!hadWorkspace) {
		console.log(`[dakiya] Created ${target}`);
	} else {
		console.log(`[dakiya] .dakiya already exists at ${target}`);
	}

	const result = scaffoldWorkspace(fs, cwd, workspaceName);

	for (const created of result.created) {
		const display = path.join(target, created);
		if (created === "collections") {
			console.log(`[dakiya] Created ${display}`);
		} else {
			console.log(`[dakiya] Wrote ${display}`);
		}
	}

	for (const skipped of result.skipped) {
		console.log(`[dakiya] ${skipped} already exists — left unchanged`);
	}

	const fileCount = result.created.filter(
		(item: string) => item !== "collections",
	).length;

	if (result.created.length === 0) {
		console.log(`[dakiya] Workspace already complete`);
	} else {
		console.log(`[dakiya] Scaffolded ${fileCount} file(s) under ${target}`);
	}
}
