import { parseDocument } from "yaml";
import type { RequestBody } from "@dakiya/domain";

export function updateEndpointMethod(
	yamlSource: string,
	methodId: string,
	updates: {
		body?: RequestBody;
		headers?: Record<string, string>;
	}
): string {
	const doc = parseDocument(yamlSource);
	const methods = doc.get("methods") as any;
	if (methods && methods.items) {
		for (const methodNode of methods.items) {
			if (methodNode.get("id") === methodId) {
				if (updates.body !== undefined) {
					methodNode.set("body", updates.body);
				}
				if (updates.headers !== undefined) {
					methodNode.set("headers", updates.headers);
				}
				break;
			}
		}
	}
	return String(doc);
}

export function addEndpointMethod(
	yamlSource: string,
	methodId: string,
): string {
	const doc = parseDocument(yamlSource || "methods:\n");
	let methods = doc.get("methods") as any;
	
	if (!methods) {
		doc.set("methods", []);
		methods = doc.get("methods");
	}

	// Check if it already exists
	if (methods && methods.items) {
		for (const methodNode of methods.items) {
			if (methodNode.get("id") === methodId) {
				throw new Error(`Method ${methodId} already exists in endpoint.`);
			}
		}
	}

	// Add new method
	const newMethod = doc.createNode({
		id: methodId,
		method: methodId.toUpperCase(),
		url: "http://localhost:3000",
		headers: {},
	});
	
	methods.add(newMethod);
	return String(doc);
}
