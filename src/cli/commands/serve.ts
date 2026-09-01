import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createApiApp } from "../api/app.js";
import { DEFAULT_PORT, resolveWebDistDir } from "../constants.js";
import {
	dakiyaDir,
	hasDakiyaManifest,
	hasDakiyaWorkspace,
	loadManifest,
} from "../workspace.js";
import { runInit } from "./init.js";

function askYesNo(question: string): Promise<boolean> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			const normalized = answer.trim().toLowerCase();
			resolve(normalized === "y" || normalized === "yes");
		});
	});
}

/**
 * Ensure `.dakiya/` + core `dakiya.yaml` exist before serve.
 * If folder missing: offer to run init; decline → abort.
 * If folder exists but manifest missing: write `dakiya.yaml` via init.
 */
async function ensureDakiyaWorkspace(): Promise<boolean> {
	if (hasDakiyaWorkspace()) {
		if (!hasDakiyaManifest()) {
			console.log(
				`[dakiya] .dakiya/ found but dakiya.yaml is missing — scaffolding core manifest`,
			);
			runInit();
		}
		return hasDakiyaManifest();
	}

	console.error(`[dakiya] No .dakiya/ found in ${process.cwd()}`);
	console.error(`[dakiya] A workspace folder is required before serve.`);

	const shouldInit = await askYesNo(
		`[dakiya] Run \`dakiya init\` now to create it? [y/N] `,
	);

	if (!shouldInit) {
		console.error(
			`[dakiya] Aborted. Create .dakiya/ with \`dakiya init\` and try again.`,
		);
		return false;
	}

	runInit();

	if (!hasDakiyaWorkspace() || !hasDakiyaManifest()) {
		console.error(
			`[dakiya] Failed to create .dakiya/ workspace. Aborting serve.`,
		);
		return false;
	}

	return true;
}

/** Start the web dashboard + `/api` on localhost (default 4242). */
export async function runServe(port = DEFAULT_PORT): Promise<void> {
	const ready = await ensureDakiyaWorkspace();
	if (!ready) {
		process.exitCode = 1;
		return;
	}

	const webDist = resolveWebDistDir();
	const api = createApiApp({ cwd: process.cwd() });
	const app = new Hono();

	// 1. Mount the local API under /api
	app.route("/api", api);

	// 2. Serve built static assets if present
	if (fs.existsSync(webDist)) {
		const relativeDist = path.relative(process.cwd(), webDist) || ".";
		app.use(
			"/*",
			serveStatic({
				root: relativeDist,
			}),
		);

		// SPA fallback to index.html for all non-API GET requests
		const indexPath = path.join(webDist, "index.html");
		if (fs.existsSync(indexPath)) {
			const indexHtml = fs.readFileSync(indexPath, "utf-8");
			app.get("*", (c) => {
				if (c.req.path.startsWith("/api")) {
					return c.json({ error: "Not Found" }, 404);
				}
				return c.html(indexHtml);
			});
		}
	}

	try {
		serve({
			fetch: app.fetch,
			port,
		});
	} catch (err) {
		console.error(`[dakiya] Failed to start server:`, err);
		process.exitCode = 1;
		return;
	}

	const url = `http://localhost:${port}`;
	const manifest = loadManifest();
	console.log(`[dakiya] Workspace: ${dakiyaDir()}`);
	console.log(
		`[dakiya] Default version: ${manifest.versions?.[0] || manifest.defaultVersionName}`,
	);
	console.log(`[dakiya] Serving dashboard at ${url}`);
	console.log(`[dakiya] API health: ${url}/api/health`);
	console.log(`[dakiya] Press Ctrl+C to stop`);
}
