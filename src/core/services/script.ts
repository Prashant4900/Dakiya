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

export type RunScriptInput = {
	phase: ScriptPhase;
	script: ScriptBlock;
	request: MutableRequest;
	/** Present for `@post` only. */
	response?: MutableResponse;
	/** Mutable env bag — scripts may read/write. */
	variables: EnvironmentVariables;
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
