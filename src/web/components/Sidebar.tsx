import { FilePlus, FolderPlus } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CollectionNode, RequestIndexItem } from "../api/types.js";
import { useStore } from "../store.js";
import type { CollectionTreeActions } from "./CollectionTree.js";
import { CollectionTree } from "./CollectionTree.js";
import { EnvSwitcher } from "./EnvSwitcher.js";
import { VersionSwitcher } from "./VersionSwitcher.js";

const MIN_WIDTH = 200;
const MAX_WIDTH = 450;

type SidebarProps = {
	tree: CollectionNode[];
	requestIndex: RequestIndexItem[];
	environments: string[];
	onManageEnv: () => void;
	versions: string[];
	actions?: CollectionTreeActions;
};

export function Sidebar({
	tree,
	requestIndex,
	environments,
	onManageEnv,
	versions,
	actions,
}: SidebarProps) {
	const {
		selectedPath,
		setSelectedPath,
		activeEnv,
		setActiveEnv,
		activeVersion,
		setActiveVersion,
		setIsNewRequestModalOpen,
		setIsNewFolderPromptOpen,
	} = useStore();
	const [search, setSearch] = useState("");
	const [width, setWidth] = useState(250);
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

	return (
		<aside
			className="relative flex flex-col h-full bg-background border-r border-border shrink-0"
			style={{ width }}
		>
			<div
				className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-10 -mr-[3px] ${resizing ? "bg-primary/50" : "bg-transparent"}`}
				onPointerDown={startResize}
				onPointerMove={onResize}
				onPointerUp={endResize}
				title="Drag to resize"
			/>
			<div className="flex flex-col gap-4 p-4 border-b border-border">
				<div className="flex items-center gap-2">
					<img
						src="/icon-192.png"
						alt="Dakiya"
						className="w-6 h-6 rounded shadow-sm"
					/>
					<span className="font-semibold tracking-tight">Dakiya</span>
					<span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono uppercase border border-border/50">
						{activeVersion || "v1"}
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<EnvSwitcher
						environments={environments}
						activeEnv={activeEnv}
						onEnvChange={setActiveEnv}
						onManage={onManageEnv}
					/>
					<VersionSwitcher
						versions={versions}
						activeVersion={activeVersion}
						onVersionChange={setActiveVersion}
					/>
				</div>
			</div>

			<div className="p-3 border-b border-border">
				<div className="flex items-center gap-2">
					<Input
						placeholder="Search requests…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="flex-1 h-8"
					/>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsNewRequestModalOpen(true)}
						title="New Request"
						className="h-8 w-8 shrink-0"
					>
						<FilePlus className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
				<div className="flex justify-between items-center px-2 mb-2">
					<span className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
						Requests
					</span>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsNewFolderPromptOpen(true)}
						title="New Folder"
						className="h-6 w-6 text-muted-foreground hover:text-foreground"
					>
						<FolderPlus className="h-3.5 w-3.5" />
					</Button>
				</div>
				{tree.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center p-4">
						No requests in this version
					</p>
				) : (
					<CollectionTree
						nodes={tree}
						requestIndex={requestIndex}
						selectedPath={selectedPath}
						onSelect={setSelectedPath}
						search={search}
						versionPrefix={activeVersion ?? ""}
						actions={actions}
					/>
				)}
			</div>
		</aside>
	);
}
