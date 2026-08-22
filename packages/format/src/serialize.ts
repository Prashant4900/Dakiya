/**
 * Serialize a `RequestDocument` back to `.drq` source.
 */

import type { ExampleResponse, RequestDocument } from "@dakiya/domain";
import { type DrqBlock, joinBlocks } from "./blocks.js";

function serializeMeta(doc: RequestDocument): DrqBlock {
	const lines = [`name: ${doc.meta.name}`, `type: ${doc.meta.type}`];
	return { name: "meta", attrs: "", body: lines.join("\n") };
}

function serializeRequest(doc: RequestDocument): DrqBlock {
	const lines = [`${doc.request.method} ${doc.request.url}`];
	for (const [key, value] of Object.entries(doc.request.headers)) {
		lines.push(`${key}: ${value}`);
	}
	return { name: "request", attrs: "", body: lines.join("\n") };
}

function serializeScript(
	name: "pre" | "post",
	block: NonNullable<RequestDocument["pre"]>,
): DrqBlock {
	const attrs = block.lang === "js" ? "lang=js" : `lang=${block.lang}`;
	return { name, attrs, body: block.source };
}

function serializeExampleResponse(response: ExampleResponse): string {
	if (response.type === "file") {
		return `@file(${response.path})`;
	}
	return response.content;
}

function serializeExample(
	example: NonNullable<RequestDocument["examples"]>[number],
): DrqBlock {
	const lines: string[] = [];
	if (example.status !== undefined) {
		lines.push(`status: ${example.status}`);
	}
	if (example.response) {
		const value = serializeExampleResponse(example.response);
		if (value.includes("\n")) {
			lines.push("response:");
			lines.push(value);
		} else {
			lines.push(`response: ${value}`);
		}
	}
	return {
		name: "example",
		attrs: example.name,
		body: lines.join("\n"),
	};
}

/** Serialize a parsed document to `.drq` text. */
export function serializeDrq(doc: RequestDocument): string {
	const blocks: DrqBlock[] = [serializeMeta(doc), serializeRequest(doc)];

	// if (doc.body !== undefined && doc.body !== "") {
	// 	blocks.push({ name: "body", attrs: "", body: doc.body });
	// }
	if (doc.docs !== undefined && doc.docs !== "") {
		blocks.push({ name: "docs", attrs: "", body: doc.docs });
	}
	if (doc.pre) {
		blocks.push(serializeScript("pre", doc.pre));
	}
	if (doc.post) {
		blocks.push(serializeScript("post", doc.post));
	}
	for (const example of doc.examples ?? []) {
		blocks.push(serializeExample(example));
	}
	for (const assert of doc.asserts ?? []) {
		blocks.push({ name: "assert", attrs: "", body: assert.source });
	}

	return joinBlocks(blocks);
}
