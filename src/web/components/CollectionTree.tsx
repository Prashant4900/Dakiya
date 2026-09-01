import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
		<div
			ref={ref}
			className="fixed z-[9999] bg-popover border border-border rounded-md shadow-md p-1 min-w-[160px] animate-in fade-in-0 zoom-in-95"
			style={{ top, left }}
			role="menu"
		>
			{items.map((item) => (
				<Button
					key={item.label}
					role="menuitem"
					className={`w-full justify-start text-xs font-normal h-8 px-2 ${item.danger ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : ""}`}
					onClick={() => {
						item.onClick();
						onClose();
					}}
					variant="ghost"
				>
					{item.label}
				</Button>
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
			className="flex-1 bg-card border border-primary rounded-sm px-1.5 py-[1px] text-xs text-foreground outline-none"
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
		<div className="mb-0.5">
			<div className="flex items-center relative group">
				<Button
					ref={btnRef}
					className="flex-1 h-7 px-2 justify-start font-normal text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors gap-1.5"
					onClick={() => setOpen((v) => !v)}
					variant="ghost"
				>
					<span
						className={`text-[10px] transition-transform duration-150 ${open ? "rotate-90" : ""}`}
					>
						▶
					</span>
					<span className="text-[13px]">📁</span>
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
						<span className="text-xs font-medium">{name}</span>
					)}
					<span className="text-[10px] ml-auto">{count}</span>
				</Button>

				{!renaming && actions && (
					<Button
						className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted h-6 w-6 ml-auto"
						title="Folder options"
						onClick={(e) => {
							e.stopPropagation();
							setMenuRect(e.currentTarget.getBoundingClientRect());
						}}
						variant="ghost"
						size="icon"
					>
						⋯
					</Button>
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
			<div
				className={`flex items-center relative group rounded-md ${active ? "bg-transparent" : ""}`}
			>
				<Button
					className={`flex-1 h-7 px-2 justify-start font-normal hover:bg-muted/50 gap-1.5 text-left text-muted-foreground ${active ? "bg-muted/80 text-foreground" : ""}`}
					onClick={() => onSelect(path)}
					variant="ghost"
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
						<span
							className={`text-[11px] whitespace-nowrap overflow-hidden text-ellipsis ${active ? "text-foreground" : "text-muted-foreground"}`}
						>
							{name}
						</span>
					)}
				</Button>

				{!renaming && actions && (
					<Button
						className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted h-6 w-6 ml-auto absolute right-1 bg-background/80 backdrop-blur-sm"
						title="Request options"
						onClick={(e) => {
							e.stopPropagation();
							setMenuRect(e.currentTarget.getBoundingClientRect());
						}}
						variant="ghost"
						size="icon"
					>
						⋯
					</Button>
				)}
			</div>

			{menuRect && (
				<ContextMenu
					items={menuItems}
					anchorRect={menuRect}
					onClose={() => setMenuRect(null)}
				/>
			)}

			{showMoveDialog && (
				<Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
					<DialogContent className="sm:max-w-[380px]">
						<DialogHeader>
							<DialogTitle>Move "{name}"</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-2 py-4">
							<span className="text-muted-foreground font-medium text-sm">
								Target folder
							</span>
							<select
								value={moveTarget}
								onChange={(e) => setMoveTarget(e.target.value)}
								className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
							>
								{allFolders.map((f) => (
									<option
										key={f}
										value={f}
										className="bg-background text-foreground"
									>
										{f}
									</option>
								))}
							</select>
						</div>
						<DialogFooter>
							<Button
								variant="secondary"
								onClick={() => setShowMoveDialog(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									if (moveTarget) {
										actions?.onRequestMove?.(path);
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
							>
								Move
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
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
