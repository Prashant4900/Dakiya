import type { RequestBody } from "@dakiya/domain";
import { parseDocument, stringify } from "yaml";

export function updateEndpointMethod(
	yamlSource: string,
	methodId: string,
	updates: {
		body?: RequestBody;
		headers?: Record<string, string>;
	},
): string {
	const doc = parseDocument(yamlSource);
	const methods = doc.get("methods") as import("yaml").YAMLSeq;
	if (methods?.items) {
		for (const methodNode of methods.items as import("yaml").YAMLMap[]) {
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

/** Rename the display name of a method (not its id). */
export function renameEndpointMethod(
	yamlSource: string,
	methodId: string,
	newName: string,
): string {
	const doc = parseDocument(yamlSource);
	const methods = doc.get("methods") as import("yaml").YAMLSeq;
	if (methods?.items) {
		for (const methodNode of methods.items as import("yaml").YAMLMap[]) {
			if (methodNode.get("id") === methodId) {
				methodNode.set("name", newName);
				break;
			}
		}
	}
	return String(doc);
}

/** Remove a method entry from the YAML. Returns updated YAML string. */
export function deleteEndpointMethod(
	yamlSource: string,
	methodId: string,
): string {
	const doc = parseDocument(yamlSource);
	const methods = doc.get("methods") as import("yaml").YAMLSeq;
	if (methods?.items) {
		const idx = (methods.items as import("yaml").YAMLMap[]).findIndex(
			(m) => m.get("id") === methodId,
		);
		if (idx !== -1) methods.items.splice(idx, 1);
	}
	return String(doc);
}

/** Extract a method's plain object data (for moving it to another file). */
export function extractEndpointMethodData(
	yamlSource: string,
	methodId: string,
): Record<string, unknown> | undefined {
	const doc = parseDocument(yamlSource);
	const methods = doc.get("methods") as import("yaml").YAMLSeq;
	if (methods?.items) {
		for (const methodNode of methods.items as import("yaml").YAMLMap[]) {
			if (methodNode.get("id") === methodId) {
				return methodNode.toJSON() as Record<string, unknown>;
			}
		}
	}
	return undefined;
}

/** Append a raw method object (from extractEndpointMethodData) to a YAML. */
export function appendEndpointMethodData(
	yamlSource: string,
	data: Record<string, unknown>,
): string {
	const doc = parseDocument(
		yamlSource || stringify({ name: data.id, type: "http", methods: [] }),
	);
	let methods = doc.get("methods") as import("yaml").YAMLSeq;
	if (!methods) {
		doc.set("methods", []);
		methods = doc.get("methods") as import("yaml").YAMLSeq;
	}
	const newNode = doc.createNode(data);
	methods.add(newNode);
	return String(doc);
}

export function addEndpointMethod(
	yamlSource: string,
	methodId: string,
): string {
	const doc = parseDocument(yamlSource || "methods:\n");
	let methods = doc.get("methods") as import("yaml").YAMLSeq;

	if (!methods) {
		doc.set("methods", []);
		methods = doc.get("methods") as import("yaml").YAMLSeq;
	}

	// Check if it already exists
	if (methods?.items) {
		for (const methodNode of methods.items as import("yaml").YAMLMap[]) {
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
