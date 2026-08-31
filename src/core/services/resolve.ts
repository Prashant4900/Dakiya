import type {
	EnvironmentVariables,
	RequestBody,
	RequestDocument,
	ResolvedHttpRequest,
} from "@core/domain";
import { resolveRecord, resolveVars } from "./vars.js";

function resolveBody(
	body: RequestBody,
	variables: EnvironmentVariables,
): RequestBody {
	if (typeof body === "string") {
		return resolveVars(body, variables);
	}
	const resolved = { ...body };
	if (resolved.raw) {
		resolved.raw = {
			...resolved.raw,
			content: resolveVars(resolved.raw.content, variables),
		};
	}
	if (resolved.formData) {
		resolved.formData = resolved.formData.map((item) => ({
			...item,
			value: resolveVars(item.value, variables),
		}));
	}
	if (resolved.urlencoded) {
		resolved.urlencoded = resolved.urlencoded.map((item) => ({
			...item,
			value: resolveVars(item.value, variables),
		}));
	}
	if (resolved.graphql) {
		resolved.graphql = {
			...resolved.graphql,
			query: resolveVars(resolved.graphql.query, variables),
			variables: resolved.graphql.variables
				? resolveVars(resolved.graphql.variables, variables)
				: undefined,
		};
	}
	// For binary, we probably don't resolve the file path, but we could.
	if (resolved.binary) {
		resolved.binary = {
			...resolved.binary,
			file: resolveVars(resolved.binary.file, variables),
		};
	}
	return resolved;
}

/** Apply environment variables to a parsed request document. */
export function resolveRequest(
	doc: RequestDocument,
	variables: EnvironmentVariables,
): ResolvedHttpRequest {
	return {
		method: doc.request.method,
		url: resolveVars(doc.request.url, variables),
		headers: resolveRecord(doc.request.headers, variables),
		...(doc.body !== undefined
			? { body: resolveBody(doc.body, variables) }
			: {}),
	};
}
