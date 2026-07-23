/**
 * MVP `.drq` parser — `@meta`, `@request`, `@body`, `@docs`.
 * `@pre` / `@post` / `@example` / `@assert` are skipped until scripts land.
 */

import type { HttpMethod, RequestDocument, RequestMeta } from "@dakiya/domain";

export const FORMAT_VERSION = "0.0.1";

const HTTP_METHODS = new Set<string>([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
]);

/** Blocks the MVP parser understands. */
const KNOWN_BLOCKS = new Set(["meta", "request", "body", "docs"]);

/** Blocks deferred (scripts / examples) — content is ignored for now. */
const SKIPPED_BLOCKS = new Set(["pre", "post", "example", "assert"]);

type Block = {
	name: string;
	/** Raw attribute string after `@name`, e.g. `lang=js` or `Success`. */
	attrs: string;
	body: string;
};

function splitBlocks(source: string): Block[] {
	const lines = source.replace(/\r\n/g, "\n").split("\n");
	const blocks: Block[] = [];
	let current: Block | null = null;
	const bodyLines: string[] = [];

	const flush = () => {
		if (!current) return;
		// Trim trailing blank lines; keep intentional leading content.
		while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === "") {
			bodyLines.pop();
		}
		current.body = bodyLines.join("\n");
		blocks.push(current);
		bodyLines.length = 0;
		current = null;
	};

	for (const line of lines) {
		const match = /^@(\w+)(?:\s+(.*))?$/.exec(line);
		if (match) {
			flush();
			current = {
				name: match[1]!.toLowerCase(),
				attrs: (match[2] ?? "").trim(),
				body: "",
			};
			continue;
		}
		if (current) {
			bodyLines.push(line);
		}
	}
	flush();
	return blocks;
}

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

	const first = lines[0]!.trim();
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

	for (const block of blocks) {
		if (SKIPPED_BLOCKS.has(block.name)) {
			continue;
		}
		if (!KNOWN_BLOCKS.has(block.name)) {
			// Unknown block names: ignore for forward compatibility.
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
		}
	}

	if (!request) {
		throw new Error("Missing @request block");
	}

	return {
		relativePath,
		meta: meta ?? { name: "Untitled", type: "http" },
		request,
		...(body !== undefined && body !== "" ? { body } : {}),
		...(docs !== undefined && docs !== "" ? { docs } : {}),
	};
}
