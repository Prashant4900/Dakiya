/**
 * MVP `.drq` parser — all v1 blocks including `@example` and `@assert`.
 */

import type {
	ExampleResponse,
	HttpMethod,
	RequestAssert,
	RequestDocument,
	RequestExample,
	RequestMeta,
	ScriptBlock,
	ScriptLang,
} from "@dakiya/domain";
import { RequestDocumentSchema } from "@dakiya/domain";
import { KNOWN_BLOCKS, splitBlocks } from "./blocks.js";

const HTTP_METHODS = new Set<string>([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
]);

const FILE_REF_PATTERN = /^@file\(\s*["']?([^"')]+)["']?\s*\)$/;

function parseMeta(body: string): RequestMeta {
	let name = "Untitled";
	let type: "http" = "http";

	for (const raw of body.split("\n")) {
		const line = raw.trim();
		if (!line || line.startsWith("#")) continue;
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		const value = line.slice(idx + 1).trim();
		if (key === "name" && value) name = value;
		if (key === "type" && value === "http") type = "http";
	}

	return { name, type };
}

function parseRequest(body: string): RequestDocument["request"] {
	const lines = body.split("\n").filter((l) => l.trim() !== "");
	if (lines.length === 0) {
		throw new Error("@request block is empty");
	}

	const first = lines[0]?.trim() ?? "";
	const space = first.indexOf(" ");
	if (space === -1) {
		throw new Error(`@request first line must be "METHOD URL", got: ${first}`);
	}

	const methodRaw = first.slice(0, space).toUpperCase();
	const url = first.slice(space + 1).trim();
	if (!HTTP_METHODS.has(methodRaw)) {
		throw new Error(`Unsupported HTTP method: ${methodRaw}`);
	}
	if (!url) {
		throw new Error("@request URL is empty");
	}

	const headers: Record<string, string> = {};
	for (const line of lines.slice(1)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const colon = trimmed.indexOf(":");
		if (colon === -1) {
			throw new Error(`Invalid header line in @request: ${trimmed}`);
		}
		const key = trimmed.slice(0, colon).trim();
		const value = trimmed.slice(colon + 1).trim();
		if (!key) {
			throw new Error(`Invalid header name in @request: ${trimmed}`);
		}
		headers[key] = value;
	}

	return {
		method: methodRaw as HttpMethod,
		url,
		headers,
	};
}

function parseScriptLang(attrs: string): ScriptLang {
	const match = /\blang\s*=\s*(js|ts)\b/i.exec(attrs);
	if (match?.[1]) {
		return match[1].toLowerCase() as ScriptLang;
	}
	return "js";
}

function parseScript(block: {
	attrs: string;
	body: string;
}): ScriptBlock | undefined {
	if (!block.body.trim()) return undefined;
	const lang = parseScriptLang(block.attrs);
	const header = block.attrs.replace(/\blang\s*=\s*(js|ts)\b/gi, "").trim();
	if (header) {
		// Only lang= is supported on script blocks; ignore other attrs.
	}
	return {
		lang,
		source: block.body,
	};
}

function parseExampleResponse(value: string): ExampleResponse {
	const trimmed = value.trim();
	const fileMatch = FILE_REF_PATTERN.exec(trimmed);
	if (fileMatch?.[1]) {
		return { type: "file", path: fileMatch[1].trim() };
	}
	return { type: "inline", content: trimmed };
}

function parseExample(attrs: string, body: string): RequestExample {
	const name = attrs.trim() || "Example";
	let status: number | undefined;
	let response: ExampleResponse | undefined;
	let responseLines: string[] | null = null;

	for (const raw of body.split("\n")) {
		if (responseLines !== null) {
			responseLines.push(raw);
			continue;
		}

		const line = raw.trimEnd();
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;

		const colon = trimmed.indexOf(":");
		if (colon === -1) continue;

		const key = trimmed.slice(0, colon).trim().toLowerCase();
		const value = trimmed.slice(colon + 1).trim();

		if (key === "status" && value) {
			const parsed = Number(value);
			if (!Number.isFinite(parsed)) {
				throw new Error(`Invalid example status: ${value}`);
			}
			status = parsed;
			continue;
		}

		if (key === "response") {
			if (!value) {
				responseLines = [];
			} else {
				response = parseExampleResponse(value);
			}
		}
	}

	if (responseLines !== null) {
		while (responseLines.length > 0 && responseLines.at(-1) === "") {
			responseLines.pop();
		}
		response = { type: "inline", content: responseLines.join("\n") };
	}

	return {
		name,
		...(status !== undefined ? { status } : {}),
		...(response !== undefined ? { response } : {}),
	};
}

function parseAssert(body: string): RequestAssert | undefined {
	const source = body.trimEnd();
	if (!source) return undefined;
	return { source };
}

/**
 * Parse a `.drq` source string into a `RequestDocument`.
 * @param relativePath Path relative to `.dakiya/` (e.g. `collections/health/health.drq`).
 */
export function parseDrq(source: string, relativePath = ""): RequestDocument {
	const blocks = splitBlocks(source);
	if (blocks.length === 0) {
		throw new Error("Empty .drq file — expected @meta / @request blocks");
	}

	let meta: RequestMeta | undefined;
	let request: RequestDocument["request"] | undefined;
	let body: string | undefined;
	let docs: string | undefined;
	let pre: ScriptBlock | undefined;
	let post: ScriptBlock | undefined;
	const examples: RequestExample[] = [];
	const asserts: RequestAssert[] = [];

	for (const block of blocks) {
		if (!KNOWN_BLOCKS.has(block.name)) {
			continue;
		}

		switch (block.name) {
			case "meta":
				meta = parseMeta(block.body);
				break;
			case "request":
				request = parseRequest(block.body);
				break;
			case "body":
				body = block.body;
				break;
			case "docs":
				docs = block.body;
				break;
			case "pre":
				pre = parseScript(block);
				break;
			case "post":
				post = parseScript(block);
				break;
			case "example":
				examples.push(parseExample(block.attrs, block.body));
				break;
			case "assert":
				if (block.attrs) {
					throw new Error("@assert does not accept attributes");
				}
				{
					const parsed = parseAssert(block.body);
					if (parsed) asserts.push(parsed);
				}
				break;
		}
	}

	if (!request) {
		throw new Error("Missing @request block");
	}

	const document: RequestDocument = {
		relativePath,
		meta: meta ?? { name: "Untitled", type: "http" },
		request,
		...(body !== undefined && body !== "" ? { body } : {}),
		...(docs !== undefined && docs !== "" ? { docs } : {}),
		...(pre ? { pre } : {}),
		...(post ? { post } : {}),
		...(examples.length > 0 ? { examples } : {}),
		...(asserts.length > 0 ? { asserts } : {}),
	};

	return RequestDocumentSchema.parse(document);
}
