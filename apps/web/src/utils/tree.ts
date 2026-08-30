import type { CollectionNode, RequestIndexItem } from "../api/types.js";

export function findFirstRequestPath(nodes: CollectionNode[]): string | null {
	for (const node of nodes) {
		if (node.type === "request") return node.path;
		const nested = findFirstRequestPath(node.children);
		if (nested) return nested;
	}
	return null;
}

/** Fallback when older API builds omit `requestIndex`. */
export function buildRequestIndexFallback(
	tree: CollectionNode[],
): RequestIndexItem[] {
	const items: RequestIndexItem[] = [];
	const walk = (nodes: CollectionNode[]) => {
		for (const node of nodes) {
			if (node.type === "request") {
				items.push({ path: node.path, name: node.name, method: "GET" });
			} else {
				walk(node.children);
			}
		}
	};
	walk(tree);
	return items;
}

export function extractFolders(nodes: CollectionNode[], prefix = ""): string[] {
	let folders: string[] = [];
	for (const node of nodes) {
		if (node.type === "folder") {
			const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
			folders.push(currentPath);
			folders = folders.concat(extractFolders(node.children, currentPath));
		}
	}
	return folders;
}
