import type { RequestDocument } from "../api/types.js";

export function formatExamples(document: RequestDocument): string {
	if (!document.examples?.length) return "No examples defined.";
	return document.examples
		.map((ex) => {
			const lines = [`## ${ex.name}`];
			if (ex.status !== undefined) lines.push(`status: ${ex.status}`);
			if (ex.response?.type === "file") {
				lines.push(`response: @file(${ex.response.path})`);
			} else if (ex.response?.type === "inline") {
				lines.push("response:");
				lines.push(ex.response.content);
			}
			return lines.join("\n");
		})
		.join("\n\n");
}
