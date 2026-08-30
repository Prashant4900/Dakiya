import { EndpointManifestSchema, type RequestDocument } from "@dakiya/domain";
import { parse } from "yaml";

export function parseEndpoint(
	yamlSource: string,
	relativePath: string,
	options?: {
		docsSource?: string;
		scripts?: Record<string, string>;
	},
): RequestDocument[] {
	const parsedYaml = parse(yamlSource);
	const manifest = EndpointManifestSchema.parse(parsedYaml);

	const docs = options?.docsSource;
	const scripts = options?.scripts || {};

	return manifest.methods.map((method) => {
		const requestPath = `${relativePath}/${method.id}`;

		// Find pre/post scripts for this method
		const preTs = scripts[`${method.id}.pre.ts`];
		const preJs = scripts[`${method.id}.pre.js`];
		const postTs = scripts[`${method.id}.post.ts`];
		const postJs = scripts[`${method.id}.post.js`];

		let preBlock: { lang: "ts" | "js"; source: string } | undefined;
		if (preTs) preBlock = { lang: "ts" as const, source: preTs };
		else if (preJs) preBlock = { lang: "js" as const, source: preJs };

		let postBlock: { lang: "ts" | "js"; source: string } | undefined;
		if (postTs) postBlock = { lang: "ts" as const, source: postTs };
		else if (postJs) postBlock = { lang: "js" as const, source: postJs };

		let normalizedBody = method.body;
		if (typeof method.body === "string") {
			// Strip legacy @body directive line if present
			const bodyLines = method.body.split("\n");
			const stripped = bodyLines[0].trim() === "@body" ? bodyLines.slice(1).join("\n") : method.body;
			const trimmed = stripped.trim();
			normalizedBody = {
				type: "raw",
				raw: {
					content: trimmed,
					// Detect JSON
					format: trimmed.startsWith("{") || trimmed.startsWith("[") ? "json" : "text",
				},
			};
		}

		return {
			relativePath: requestPath,
			meta: {
				name: method.name,
				type: manifest.type,
			},
			request: {
				method: method.method,
				url: method.url,
				headers: method.headers || {},
			},
			...(normalizedBody ? { body: normalizedBody } : {}),
			...(docs ? { docs } : {}),
			...(preBlock ? { pre: preBlock } : {}),
			...(postBlock ? { post: postBlock } : {}),
		};
	});
}
