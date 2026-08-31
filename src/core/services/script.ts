/**
 * Injectable script runner contract — implemented by CLI (node:vm).
 * Keeps @core/services free of Node / sandbox imports.
 */

import type {
	EnvironmentVariables,
	HttpMethod,
	RequestBody,
	ScriptBlock,
	SendResult,
} from "@core/domain";

/** Mutable request the pre-script may change before HTTP. */
export type MutableRequest = {
	method: HttpMethod;
	url: string;
	headers: Record<string, string>;
	body?: RequestBody;
};

/** Mutable response view for post-scripts. */
export type MutableResponse = {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
};

export type ScriptPhase = "pre" | "post";

/**
 * Metadata about the current request run, injected into every script context.
 * Available as `meta` in both pre- and post-scripts.
 */
export type ScriptMeta = {
	/** Human-readable name of the request (e.g. "login"). */
	requestName: string;
	/** Path relative to collections root (e.g. "auth/login/post"). */
	requestPath: string;
	/** Whether this is a pre- or post-script run. */
	phase: ScriptPhase;
	/** Unique UUID generated per request send. Useful for tracing logs. */
	traceId: string;
	/** Elapsed milliseconds from pre-script start to this point. Only present in @post. */
	durationMs?: number;
};

export type RunScriptInput = {
	phase: ScriptPhase;
	script: ScriptBlock;
	request: MutableRequest;
	/** Present for `@post` only. */
	response?: MutableResponse;
	/** Mutable env bag — scripts may read/write. */
	variables: EnvironmentVariables;
	/** Request metadata injected into the script context as `meta`. */
	meta: ScriptMeta;
};

export type RunScriptResult = {
	logs: string[];
	/** Keys written with `{ persist: true }` during this script run. */
	persistedKeys: string[];
};

export type ScriptRunner = (
	input: RunScriptInput,
) => RunScriptResult | Promise<RunScriptResult>;

export function toMutableRequest(resolved: {
	method: HttpMethod;
	url: string;
	headers: Record<string, string>;
	body?: RequestBody;
}): MutableRequest {
	return {
		method: resolved.method,
		url: resolved.url,
		headers: { ...resolved.headers },
		...(resolved.body !== undefined ? { body: resolved.body } : {}),
	};
}

export function toMutableResponse(response: SendResult): MutableResponse {
	return {
		status: response.status,
		statusText: response.statusText,
		headers: { ...response.headers },
		body: response.body,
	};
}
