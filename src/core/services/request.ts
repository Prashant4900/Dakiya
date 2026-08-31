import type {
	EnvironmentVariables,
	RequestDocument,
	ResolvedHttpRequest,
	SendResult,
} from "@core/domain";
import type { HttpClient } from "./http.js";
import { createFetchHttpClient } from "./http.js";
import { resolveRequest } from "./resolve.js";
import type { ScriptRunner } from "./script.js";
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
 */
export async function sendRequest(
	options: SendRequestOptions,
): Promise<SendRequestResult> {
	const variables: EnvironmentVariables = { ...options.variables };
	const persistedKeys = new Set<string>();
	const logs: string[] = [];

	const mutable = toMutableRequest(resolveRequest(options.document, variables));

	const scripts = options.scripts;
	if (scripts && options.document.pre) {
		const result = await scripts({
			phase: "pre",
			script: options.document.pre,
			request: mutable,
			variables,
		});
		logs.push(...result.logs);
		for (const key of result.persistedKeys) persistedKeys.add(key);
	}

	const resolved: ResolvedHttpRequest = {
		method: mutable.method,
		url: mutable.url,
		headers: { ...mutable.headers },
		...(mutable.body !== undefined ? { body: mutable.body } : {}),
	};

	const http = options.http ?? createFetchHttpClient();
	const response = await http.send(resolved);

	if (scripts && options.document.post) {
		const mutableResponse = toMutableResponse(response);
		const result = await scripts({
			phase: "post",
			script: options.document.post,
			request: mutable,
			response: mutableResponse,
			variables,
		});
		logs.push(...result.logs);
		for (const key of result.persistedKeys) persistedKeys.add(key);

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
