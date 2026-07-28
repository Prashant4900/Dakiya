import type { FsClient, FsDirEntry } from "./fs-client.js";

type DirNode = { type: "dir"; children: Map<string, MemoryNode> };
type FileNode = { type: "file"; content: string };
type MemoryNode = DirNode | FileNode;

function isDir(node: MemoryNode | undefined): node is DirNode {
	return node?.type === "dir";
}

/** In-memory FsClient for unit tests. */
export function createMemoryFs(initial: Record<string, string> = {}): FsClient {
	const root: DirNode = { type: "dir", children: new Map() };

	for (const [filePath, content] of Object.entries(initial)) {
		writePath(root, filePath, content);
	}

	function writePath(node: DirNode, filePath: string, content: string) {
		const parts = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
		let current: DirNode = node;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (!part) continue;
			const isLast = i === parts.length - 1;
			if (isLast) {
				current.children.set(part, { type: "file", content });
				return;
			}
			let child = current.children.get(part);
			if (!isDir(child)) {
				child = { type: "dir", children: new Map() };
				current.children.set(part, child);
			}
			current = child;
		}
	}

	function resolveNode(filePath: string): MemoryNode | undefined {
		const parts = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
		let current: MemoryNode | undefined = root;
		for (const part of parts) {
			if (!isDir(current)) return undefined;
			current = current.children.get(part);
		}
		return current;
	}

	function parentDir(filePath: string): { dir: DirNode; name: string } {
		const parts = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
		const name = parts.pop();
		if (!name) throw new Error(`Invalid path: ${filePath}`);
		let current: MemoryNode = root;
		for (const part of parts) {
			if (!isDir(current)) {
				throw new Error(`Directory not found: ${filePath}`);
			}
			const child = current.children.get(part);
			if (!isDir(child)) {
				throw new Error(`Directory not found: ${filePath}`);
			}
			current = child;
		}
		if (!isDir(current)) {
			throw new Error(`Directory not found: ${filePath}`);
		}
		return { dir: current, name };
	}

	return {
		readFile(path) {
			const node = resolveNode(path);
			if (node?.type !== "file") {
				throw new Error(`File not found: ${path}`);
			}
			return node.content;
		},
		writeFile(path, content) {
			writePath(root, path, content);
		},
		exists(path) {
			return resolveNode(path) !== undefined;
		},
		mkdir(path) {
			const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
			let current: DirNode = root;
			for (const part of parts) {
				let child = current.children.get(part);
				if (!isDir(child)) {
					child = { type: "dir", children: new Map() };
					current.children.set(part, child);
				}
				current = child;
			}
		},
		removeFile(path) {
			const { dir, name } = parentDir(path);
			dir.children.delete(name);
		},
		readDir(path) {
			const node = resolveNode(path);
			if (!isDir(node)) {
				throw new Error(`Directory not found: ${path}`);
			}
			const entries: FsDirEntry[] = [];
			for (const [name, child] of node.children.entries()) {
				entries.push({
					name,
					isDirectory: child.type === "dir",
					isFile: child.type === "file",
				});
			}
			return entries;
		},
	};
}
