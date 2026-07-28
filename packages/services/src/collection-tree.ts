export type CollectionNode =
	| { name: string; type: "folder"; children: CollectionNode[] }
	| { name: string; type: "request"; path: string };

/** Build a nested folder tree from flat collection-relative `.drq` paths. */
export function buildCollectionTree(paths: string[]): CollectionNode[] {
	type MutableNode = {
		name: string;
		type: "folder" | "request";
		path?: string;
		children?: Map<string, MutableNode>;
	};

	const root = new Map<string, MutableNode>();

	for (const rel of paths) {
		const parts = rel.split("/");
		let cursor = root;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (!part) continue;
			const isLeaf = i === parts.length - 1;
			if (isLeaf) {
				const name = part.replace(/\.drq$/, "");
				cursor.set(part, {
					name,
					type: "request",
					path: rel,
				});
			} else {
				let folder = cursor.get(part);
				if (!folder) {
					folder = {
						name: part,
						type: "folder",
						children: new Map(),
					};
					cursor.set(part, folder);
				}
				if (!folder.children) folder.children = new Map();
				cursor = folder.children;
			}
		}
	}

	const toArray = (map: Map<string, MutableNode>): CollectionNode[] =>
		[...map.values()]
			.map((node) => {
				if (node.type === "folder") {
					return {
						name: node.name,
						type: "folder" as const,
						children: toArray(node.children ?? new Map()),
					};
				}
				return {
					name: node.name,
					type: "request" as const,
					path: node.path ?? "",
				};
			})
			.sort((a, b) => {
				if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
				return a.name.localeCompare(b.name);
			});

	return toArray(root);
}
