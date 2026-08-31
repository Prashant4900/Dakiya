import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { createApiApp } from "../api/app.js";
import { createHonoMiddleware } from "../api/middleware.js";
import {
	dakiyaDir,
	hasDakiyaManifest,
	hasDakiyaWorkspace,
	loadManifest,
} from "../workspace.js";
import { runInit } from "./init.js";

const DEFAULT_PORT = 4242;

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

/** Resolve monorepo `apps/web` from this file (`apps/cli/dist/commands/serve.js`). */
function resolveWebRoot(): string {
	const here = path.dirname(fileURLToPath(import.meta.url));
	const candidate = path.resolve(here, "../../../web");
	const pkg = path.join(candidate, "package.json");

	if (!fs.existsSync(pkg)) {
		throw new Error(
			`Could not find @dakiya/web at ${candidate}. Run from the Dakiya monorepo (pnpm link:cli).`,
		);
	}

	return candidate;
}

/** Start the web dashboard + `/api` on localhost (default 4242). */
export async function runServe(port = DEFAULT_PORT): Promise<void> {
	const ready = await ensureDakiyaWorkspace();
	if (!ready) {
		process.exitCode = 1;
		return;
	}

	const webRoot = resolveWebRoot();
	const api = createApiApp({ cwd: process.cwd() });

	let server: Awaited<ReturnType<typeof createServer>>;
	server = await createServer({
		root: webRoot,
		configFile: path.join(webRoot, "vite.config.ts"),
		server: {
			port,
			strictPort: false,
			host: "localhost",
		},
	});

	// Prepend so /api is handled before Vite's SPA / static fallback.
	const apiMiddleware = createHonoMiddleware(api, "/api");
	server.middlewares.use(apiMiddleware);
	const stack = server.middlewares.stack;
	const entry = stack.pop();
	if (entry) stack.unshift(entry);

	try {
		await server.listen();
	} catch (err) {
		console.error(`[dakiya] Failed to start server:`, err);
		process.exitCode = 1;
		return;
	}

	const address = server.httpServer?.address();
	const resolvedPort =
		typeof address === "object" && address !== null && "port" in address
			? address.port
			: port;
	const url = `http://localhost:${resolvedPort}`;
	const manifest = loadManifest();
	console.log(`[dakiya] Workspace: ${dakiyaDir()}`);
	console.log(
		`[dakiya] Default version: ${manifest.versions?.[0] || manifest.defaultVersionName}`,
	);
	if (resolvedPort !== port) {
		console.log(
			`[dakiya] Port ${port} was in use, using ${resolvedPort} instead.`,
		);
	}
	console.log(`[dakiya] Serving dashboard at ${url}`);
	console.log(`[dakiya] API health: ${url}/api/health`);
	console.log(`[dakiya] Press Ctrl+C to stop`);
}
