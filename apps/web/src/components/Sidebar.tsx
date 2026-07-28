import { useState } from "react";
import type { CollectionNode, RequestIndexItem } from "../api/types.js";
import { CollectionTree } from "./CollectionTree.js";
import { EnvSwitcher } from "./EnvSwitcher.js";

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
}: SidebarProps) {
	const [search, setSearch] = useState("");

	return (
		<aside className="sidebar">
			<div className="sidebar-header">
				<div className="logo-row">
					<div className="logo-mark">D</div>
					<span className="logo-name">Dakiya</span>
					<span className="logo-version">v0.1</span>
				</div>
				<EnvSwitcher
					environments={environments}
					activeEnv={activeEnv}
					onEnvChange={onEnvChange}
					onEdit={onEditEnv}
				/>
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
				{tree.length === 0 ? (
					<p className="empty-hint">No requests in collections/</p>
				) : (
					<CollectionTree
						nodes={tree}
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
