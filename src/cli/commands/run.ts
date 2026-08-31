import { sendRequest } from "@core/services";
import { persistEnvironmentVariables } from "../sandbox/persist-env.js";
import { createVmScriptRunner } from "../sandbox/run-script.js";
import {
	loadActiveEnvironment,
	readRequestSource,
	requireWorkspace,
} from "../workspace.js";

function formatBody(body: string, contentType: string | undefined): string {
	if (!body) return "(empty)";
	if (contentType?.includes("application/json")) {
		try {
			return JSON.stringify(JSON.parse(body), null, 2);
		} catch {
			return body;
		}
	}
	return body;
}

/** Load a `.drq`, resolve env vars, run scripts, send HTTP, print the response. */
export async function runRun(requestArg: string | undefined): Promise<void> {
	if (!requestArg) {
		console.error(`[dakiya] Usage: dakiya run <path>`);
		console.error(`[dakiya] Example: dakiya run health/health`);
		process.exitCode = 1;
		return;
	}

	requireWorkspace();
	const env = loadActiveEnvironment();
	const document = readRequestSource(requestArg);

	console.log(`[dakiya] ${document.meta.name}  (${document.relativePath})`);
	console.log(`[dakiya] Env: ${env.name}`);

	const { resolved, response, persistedVariables, logs } = await sendRequest({
		document,
		variables: env.variables,
		scripts: createVmScriptRunner(),
	});

	for (const line of logs) {
		console.log(`[script] ${line}`);
	}

	if (Object.keys(persistedVariables).length > 0) {
		persistEnvironmentVariables(env.name, persistedVariables);
		console.log(
			`[dakiya] Persisted env: ${Object.keys(persistedVariables).join(", ")}`,
		);
	}

	console.log("");
	console.log(`→ ${resolved.method} ${resolved.url}`);
	for (const [key, value] of Object.entries(resolved.headers)) {
		console.log(`  ${key}: ${value}`);
	}
	if (resolved.body) {
		console.log("");
		console.log(resolved.body);
	}

	console.log("");
	console.log(
		`← ${response.status} ${response.statusText}  (${response.durationMs}ms)`,
	);
	for (const [key, value] of Object.entries(response.headers)) {
		console.log(`  ${key}: ${value}`);
	}
	console.log("");
	console.log(formatBody(response.body, response.headers["content-type"]));

	if (response.status >= 400) {
		process.exitCode = 1;
	}
}
