import type {
	EnvironmentVariables,
	RequestDocument,
	ResolvedHttpRequest,
	SendResult,
} from "@core/domain";
import type { HttpClient } from "./http.js";
import { createFetchHttpClient } from "./http.js";
import { resolveRequest } from "./resolve.js";
import type { ScriptMeta, ScriptRunner } from "./script.js";
import { toMutableRequest, toMutableResponse } from "./script.js";

export type SendRequestOptions = {
	document: RequestDocument;
	variables: EnvironmentVariables;
	http?: HttpClient;
	/** Injected by CLI — runs `@pre` / `@post` in a sandbox. */
	scripts?: ScriptRunner;
};

export type SendRequestResult = {
	resolved: ResolvedHttpRequest;
	response: SendResult;
	/** Final variable bag after scripts (includes non-persisted mutations). */
	variables: EnvironmentVariables;
	/** Subset of variables that scripts marked `{ persist: true }`. */
	persistedVariables: EnvironmentVariables;
	logs: string[];
};

/**
 * Resolve `{{vars}}` → optional `@pre` → HTTP → optional `@post`.
 *
 * Error policy:
 *  - @pre error  → request is BLOCKED, error re-thrown to caller.
 *  - @post error → raw response is returned, error appended to logs.
 */
export async function sendRequest(
	options: SendRequestOptions,
): Promise<SendRequestResult> {
	const variables: EnvironmentVariables = { ...options.variables };
	const persistedKeys = new Set<string>();
	const logs: string[] = [];

	// Unique trace ID per send — available in both pre and post scripts.
	const traceId = crypto.randomUUID();
	const startTime = performance.now();

	const mutable = toMutableRequest(resolveRequest(options.document, variables));

	const baseMeta: Omit<ScriptMeta, "durationMs"> = {
		requestName: options.document.meta.name ?? options.document.relativePath,
		requestPath: options.document.relativePath,
		phase: "pre",
		traceId,
	};

	const scripts = options.scripts;

	// ── Pre-script ──────────────────────────────────────────────────────────
	if (scripts && options.document.pre) {
		// Throws on error → blocks HTTP request (by design).
		const result = await scripts({
			phase: "pre",
			script: options.document.pre,
			request: mutable,
			variables,
			meta: { ...baseMeta, phase: "pre" },
		});
		logs.push(...result.logs);
		for (const key of result.persistedKeys) persistedKeys.add(key);
	}

	// ── HTTP ─────────────────────────────────────────────────────────────────
	const resolved: ResolvedHttpRequest = {
		method: mutable.method,
		url: mutable.url,
		headers: { ...mutable.headers },
		...(mutable.body !== undefined ? { body: mutable.body } : {}),
	};

	const http = options.http ?? createFetchHttpClient();
	const response = await http.send(resolved);

	const durationMs = Math.round(performance.now() - startTime);

	// ── Post-script ──────────────────────────────────────────────────────────
	if (scripts && options.document.post) {
		const mutableResponse = toMutableResponse(response);
		try {
			const result = await scripts({
				phase: "post",
				script: options.document.post,
				request: mutable,
				response: mutableResponse,
				variables,
				meta: { ...baseMeta, phase: "post", durationMs },
			});
			logs.push(...result.logs);
			for (const key of result.persistedKeys) persistedKeys.add(key);
		} catch (err) {
			// Post-script errors are non-fatal — surface in logs.
			const msg = err instanceof Error ? err.message : String(err);
			logs.push(`[post-script error] ${msg}`);
		}

		// Post may mutate response body/status for the caller.
		response.status = mutableResponse.status;
		response.statusText = mutableResponse.statusText;
		response.headers = { ...mutableResponse.headers };
		response.body = mutableResponse.body;
	}

	const persistedVariables: EnvironmentVariables = {};
	for (const key of persistedKeys) {
		const value = variables[key];
		if (value !== undefined) {
			persistedVariables[key] = value;
		}
	}

	return {
		resolved,
		response,
		variables,
		persistedVariables,
		logs,
	};
}

