import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CollectionNode, RequestIndexItem } from "../api/types.js";
import { methodBadgeClass } from "../utils/method.js";

// ── Context menu ────────────────────────────────────────────────────────────

type MenuItem = {
	label: string;
	danger?: boolean;
	onClick: () => void;
};

function ContextMenu({
	items,
	anchorRect,
	onClose,
}: {
	items: MenuItem[];
	anchorRect: DOMRect;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handle(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose();
		}
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [onClose]);

	const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 160);
	const left = Math.min(anchorRect.left, window.innerWidth - 180);

	return createPortal(
		<div ref={ref} className="ctx-menu" style={{ top, left }} role="menu">
			{items.map((item) => (
				<button
					key={item.label}
					type="button"
					role="menuitem"
					className={`ctx-menu-item${item.danger ? " danger" : ""}`}
					onClick={() => {
						item.onClick();
						onClose();
					}}
				>
					{item.label}
				</button>
			))}
		</div>,
		document.body,
	);
}

// ── Inline rename input ──────────────────────────────────────────────────────

function InlineRename({
	initial,
	onCommit,
	onCancel,
}: {
	initial: string;
	onCommit: (v: string) => void;
	onCancel: () => void;
}) {
	const [value, setValue] = useState(initial);
	const ref = useRef<HTMLInputElement>(null);

	useEffect(() => {
		ref.current?.select();
	}, []);

	return (
		<input
			ref={ref}
			className="inline-rename-input"
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					if (value.trim()) onCommit(value.trim());
				} else if (e.key === "Escape") {
					onCancel();
				}
			}}
			onBlur={() => {
				if (value.trim() && value.trim() !== initial) onCommit(value.trim());
				else onCancel();
			}}
			onClick={(e) => e.stopPropagation()}
		/>
	);
}

// ── Types ────────────────────────────────────────────────────────────────────

export type CollectionTreeActions = {
	onFolderRename?: (folderPath: string, newName: string) => void;
	onFolderDelete?: (folderPath: string) => void;
	onRequestRename?: (requestPath: string, newName: string) => void;
	onRequestDelete?: (requestPath: string) => void;
	onRequestMove?: (requestPath: string) => void;
};

type TreeProps = {
	nodes: CollectionNode[];
	requestIndex: RequestIndexItem[];
	selectedPath: string | null;
	onSelect: (path: string) => void;
	search: string;
	/** Version-level folder path prefix, e.g. "v1" */
	versionPrefix?: string;
	actions?: CollectionTreeActions;
};

// ── FolderGroup ──────────────────────────────────────────────────────────────

function FolderGroup({
	name,
	folderPath,
	count,
	children,
	defaultOpen = true,
	actions,
}: {
	name: string;
	folderPath: string;
	count: number;
	children: ReactNode;
	defaultOpen?: boolean;
	actions?: CollectionTreeActions;
}) {
	const [open, setOpen] = useState(defaultOpen);
	const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
	const [renaming, setRenaming] = useState(false);
	const btnRef = useRef<HTMLButtonElement>(null);

	const menuItems: MenuItem[] = [
		{
			label: "Rename folder",
			onClick: () => setRenaming(true),
		},
		{
			label: "Delete folder",
			danger: true,
			onClick: () => {
				if (
					window.confirm(
						`Delete folder "${name}" and all its requests? This cannot be undone.`,
					)
				) {
					actions?.onFolderDelete?.(folderPath);
				}
			},
		},
	];

	return (
		<div className="collection-group">
			<div className="group-row-wrap">
				<button
					ref={btnRef}
					type="button"
					className="group-row"
					onClick={() => setOpen((v) => !v)}
				>
					<span className={`group-chevron${open ? " open" : ""}`}>▶</span>
					<span className="group-icon">📁</span>
					{renaming ? (
						<InlineRename
							initial={name}
							onCommit={(v) => {
								actions?.onFolderRename?.(folderPath, v);
								setRenaming(false);
							}}
							onCancel={() => setRenaming(false)}
						/>
					) : (
						<span className="group-name">{name}</span>
					)}
					<span className="group-count">{count}</span>
				</button>

				{!renaming && actions && (
					<button
						type="button"
						className="item-action-btn"
						title="Folder options"
						onClick={(e) => {
							e.stopPropagation();
							setMenuRect(e.currentTarget.getBoundingClientRect());
						}}
					>
						⋯
					</button>
				)}
			</div>

			{menuRect && (
				<ContextMenu
					items={menuItems}
					anchorRect={menuRect}
					onClose={() => setMenuRect(null)}
				/>
			)}

			{open && children}
		</div>
	);
}

// ── CollectionTree ───────────────────────────────────────────────────────────

export function CollectionTree({
	nodes,
	requestIndex,
	selectedPath,
	onSelect,
	search,
	versionPrefix = "",
	actions,
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
					// Build the full relative-to-collections folder path
					const folderPath = versionPrefix
						? `${versionPrefix}/${node.name}`
						: node.name;
					return (
						<FolderGroup
							key={node.name}
							name={node.name}
							folderPath={folderPath}
							count={count}
							actions={actions}
						>
							<CollectionTree
								nodes={node.children}
								requestIndex={requestIndex}
								selectedPath={selectedPath}
								onSelect={onSelect}
								search=""
								versionPrefix={folderPath}
								actions={actions}
							/>
						</FolderGroup>
					);
				}

				// Request item
				const meta = metaByPath.get(node.path);
				const method = meta?.method ?? "GET";
				const active = selectedPath === node.path;

				return (
					<RequestItem
						key={node.path}
						path={node.path}
						name={meta?.name ?? node.name}
						method={method}
						active={active}
						onSelect={onSelect}
						actions={actions}
						allFolders={collectFolderPaths(nodes, versionPrefix)}
					/>
				);
			})}
		</>
	);
}

// ── RequestItem ──────────────────────────────────────────────────────────────

function RequestItem({
	path,
	name,
	method,
	active,
	onSelect,
	actions,
	allFolders,
}: {
	path: string;
	name: string;
	method: string;
	active: boolean;
	onSelect: (path: string) => void;
	actions?: CollectionTreeActions;
	allFolders: string[];
}) {
	const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
	const [renaming, setRenaming] = useState(false);
	const [showMoveDialog, setShowMoveDialog] = useState(false);
	const [moveTarget, setMoveTarget] = useState(allFolders[0] ?? "");

	const menuItems: MenuItem[] = [
		{
			label: "Rename",
			onClick: () => setRenaming(true),
		},
		{
			label: "Move to folder…",
			onClick: () => {
				setMoveTarget(allFolders[0] ?? "");
				setShowMoveDialog(true);
			},
		},
		{
			label: "Delete",
			danger: true,
			onClick: () => {
				if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
					actions?.onRequestDelete?.(path);
				}
			},
		},
	];

	return (
		<>
			<div className={`request-item-wrap${active ? " active" : ""}`}>
				<button
					type="button"
					className={`request-item${active ? " active" : ""}`}
					onClick={() => onSelect(path)}
				>
					<span className={`method-badge ${methodBadgeClass(method)}`}>
						{method === "DELETE" ? "DEL" : method}
					</span>
					{renaming ? (
						<InlineRename
							initial={name}
							onCommit={(v) => {
								actions?.onRequestRename?.(path, v);
								setRenaming(false);
							}}
							onCancel={() => setRenaming(false)}
						/>
					) : (
						<span className="req-name">{name}</span>
					)}
				</button>

				{!renaming && actions && (
					<button
						type="button"
						className="item-action-btn"
						title="Request options"
						onClick={(e) => {
							e.stopPropagation();
							setMenuRect(e.currentTarget.getBoundingClientRect());
						}}
					>
						⋯
					</button>
				)}
			</div>

			{menuRect && (
				<ContextMenu
					items={menuItems}
					anchorRect={menuRect}
					onClose={() => setMenuRect(null)}
				/>
			)}

			{showMoveDialog &&
				createPortal(
					// biome-ignore lint/a11y/noStaticElementInteractions: this is a modal backdrop
					<div
						className="modal-backdrop"
						role="presentation"
						onMouseDown={(e) => {
							if (e.target === e.currentTarget) setShowMoveDialog(false);
						}}
					>
						<div className="modal" role="dialog" style={{ maxWidth: 380 }}>
							<div className="modal-header">
								<h2 id="move-dialog-title">Move "{name}"</h2>
							</div>
							<label
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 6,
									fontSize: 13,
								}}
							>
								<span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
									Target folder
								</span>
								<select
									value={moveTarget}
									onChange={(e) => setMoveTarget(e.target.value)}
									style={{
										background: "var(--surface)",
										color: "var(--text-color)",
										border: "1px solid var(--border)",
										borderRadius: "var(--radius, 6px)",
										padding: "6px 10px",
										fontSize: 13,
									}}
								>
									{allFolders.map((f) => (
										<option key={f} value={f}>
											{f}
										</option>
									))}
								</select>
							</label>
							<div className="modal-actions">
								<button
									type="button"
									onClick={() => setShowMoveDialog(false)}
									style={{
										background: "none",
										border: "1px solid var(--border)",
										borderRadius: 6,
										padding: "6px 14px",
										cursor: "pointer",
										fontSize: 13,
									}}
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => {
										if (moveTarget) {
											actions?.onRequestMove?.(path);
											// We need to pass the target — call a custom handler
											(
												actions as CollectionTreeActions & {
													_onMoveWithTarget?: (
														path: string,
														target: string,
													) => void;
												}
											)?._onMoveWithTarget?.(path, moveTarget);
										}
										setShowMoveDialog(false);
									}}
									style={{
										background: "var(--primary-color)",
										color: "white",
										border: "none",
										borderRadius: 6,
										padding: "6px 14px",
										cursor: "pointer",
										fontSize: 13,
										fontWeight: 600,
									}}
								>
									Move
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}

/** Collect all folder paths (relative to collections) from tree nodes. */
function collectFolderPaths(nodes: CollectionNode[], prefix: string): string[] {
	const result: string[] = [];
	for (const node of nodes) {
		if (node.type === "folder") {
			const p = prefix ? `${prefix}/${node.name}` : node.name;
			result.push(p);
			result.push(...collectFolderPaths(node.children, p));
		}
	}
	return result;
}
