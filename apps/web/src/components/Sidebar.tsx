import { useRef, useState } from "react";
import type { CollectionNode, RequestIndexItem } from "../api/types.js";
import { CollectionTree } from "./CollectionTree.js";
import { EnvSwitcher } from "./EnvSwitcher.js";
import { VersionSwitcher } from "./VersionSwitcher.js";

const MIN_WIDTH = 150;
const MAX_WIDTH = 350;

type SidebarProps = {
	workspaceName: string;
	tree: CollectionNode[];
	requestIndex: RequestIndexItem[];
	selectedPath: string | null;
	onSelect: (path: string) => void;
	environments: string[];
	activeEnv: string;
	onEnvChange: (name: string) => void;
	onEditEnv: () => void;
	versions: string[];
	activeVersion: string | null;
	onVersionChange: (name: string) => void;
};

export function Sidebar({
	workspaceName,
	tree,
	requestIndex,
	selectedPath,
	onSelect,
	environments,
	activeEnv,
	onEnvChange,
	onEditEnv,
	versions,
	activeVersion,
	onVersionChange,
}: SidebarProps) {
	const [search, setSearch] = useState("");
	const [width, setWidth] = useState(230);
	const [resizing, setResizing] = useState(false);
	const draggingRef = useRef(false);

	const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
		draggingRef.current = true;
		setResizing(true);
		e.currentTarget.setPointerCapture(e.pointerId);
		document.body.style.userSelect = "none";
		document.body.style.cursor = "col-resize";
	};

	const onResize = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!draggingRef.current) return;
		const pane = e.currentTarget.parentElement;
		if (!pane) return;
		const next = e.clientX - pane.getBoundingClientRect().left;
		setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
	};

	const endResize = (e: React.PointerEvent<HTMLDivElement>) => {
		draggingRef.current = false;
		setResizing(false);
		document.body.style.userSelect = "";
		document.body.style.cursor = "";
		e.currentTarget.releasePointerCapture(e.pointerId);
	};

	const versionNode = tree.find((node) => node.name === activeVersion);
	const versionTree =
		versionNode?.type === "folder" ? versionNode.children : [];

	return (
		<aside className="sidebar" style={{ width }}>
			<div
				className={`resize-handle-right${resizing ? " active" : ""}`}
				onPointerDown={startResize}
				onPointerMove={onResize}
				onPointerUp={endResize}
				title="Drag to resize"
			/>
			<div className="sidebar-header">
				<div className="logo-row">
					<div className="logo-mark">D</div>
					<span className="logo-name">Dakiya</span>
					<span className="logo-version">{activeVersion || "v1"}</span>
				</div>
				<div className="sidebar-switchers">
					<EnvSwitcher
						environments={environments}
						activeEnv={activeEnv}
						onEnvChange={onEnvChange}
						onEdit={onEditEnv}
					/>
					<VersionSwitcher
						versions={versions}
						activeVersion={activeVersion}
						onVersionChange={onVersionChange}
					/>
				</div>
			</div>

			<div className="sidebar-search">
				<input
					className="search-input"
					placeholder="Search requests…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<div className="sidebar-body">
				<div className="section-label">Requests</div>
				{versionTree.length === 0 ? (
					<p className="empty-hint">No requests in this version</p>
				) : (
					<CollectionTree
						nodes={versionTree}
						requestIndex={requestIndex}
						selectedPath={selectedPath}
						onSelect={onSelect}
						search={search}
					/>
				)}
			</div>

			<div className="sidebar-footer">
				<div className="avatar">{workspaceName.charAt(0).toUpperCase()}</div>
				<span className="project-name">{workspaceName}</span>
			</div>
		</aside>
	);
}
