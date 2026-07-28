import { type ReactNode, useMemo, useState } from "react";
import type { CollectionNode, RequestIndexItem } from "../api/types.js";
import { methodBadgeClass } from "../utils/method.js";

type TreeProps = {
	nodes: CollectionNode[];
	requestIndex: RequestIndexItem[];
	selectedPath: string | null;
	onSelect: (path: string) => void;
	search: string;
};

function FolderGroup({
	name,
	count,
	children,
	defaultOpen = true,
}: {
	name: string;
	count: number;
	children: ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="collection-group">
			<button
				type="button"
				className="group-row"
				onClick={() => setOpen((v) => !v)}
			>
				<span className={`group-chevron${open ? " open" : ""}`}>▶</span>
				<span className="group-icon">📁</span>
				<span className="group-name">{name}</span>
				<span className="group-count">{count}</span>
			</button>
			{open && children}
		</div>
	);
}

export function CollectionTree({
	nodes,
	requestIndex,
	selectedPath,
	onSelect,
	search,
}: TreeProps) {
	const metaByPath = useMemo(() => {
		const map = new Map<string, RequestIndexItem>();
		for (const item of requestIndex) map.set(item.path, item);
		return map;
	}, [requestIndex]);

	const q = search.trim().toLowerCase();

	const filterNodes = (list: CollectionNode[]): CollectionNode[] => {
		if (!q) return list;
		return list
			.map((node) => {
				if (node.type === "request") {
					const meta = metaByPath.get(node.path);
					const hay =
						`${node.name} ${meta?.name ?? ""} ${node.path}`.toLowerCase();
					return hay.includes(q) ? node : null;
				}
				const children = filterNodes(node.children);
				return children.length > 0 ? { ...node, children } : null;
			})
			.filter(Boolean) as CollectionNode[];
	};

	const filtered = filterNodes(nodes);

	return (
		<>
			{filtered.map((node) => {
				if (node.type === "folder") {
					const count = node.children.filter(
						(c) => c.type === "request",
					).length;
					return (
						<FolderGroup key={node.name} name={node.name} count={count}>
							<CollectionTree
								nodes={node.children}
								requestIndex={requestIndex}
								selectedPath={selectedPath}
								onSelect={onSelect}
								search=""
							/>
						</FolderGroup>
					);
				}

				const meta = metaByPath.get(node.path);
				const method = meta?.method ?? "GET";
				const active = selectedPath === node.path;
				return (
					<button
						key={node.path}
						type="button"
						className={`request-item${active ? " active" : ""}`}
						onClick={() => onSelect(node.path)}
					>
						<span className={`method-badge ${methodBadgeClass(method)}`}>
							{method === "DELETE" ? "DEL" : method}
						</span>
						<span className="req-name">{meta?.name ?? node.name}</span>
					</button>
				);
			})}
		</>
	);
}
