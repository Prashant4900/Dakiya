import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	createFolderAPI,
	createRequestAPI,
	deleteFolderAPI,
	deleteRequestAPI,
	fetchWorkspace,
	moveRequestAPI,
	renameFolderAPI,
	renameRequestAPI,
} from "./api/client.js";
import { ConfirmDialog } from "./components/ConfirmDialog.js";
import { NewRequestModal } from "./components/NewRequestModal.js";
import { PromptDialog } from "./components/PromptDialog.js";
import { Sidebar } from "./components/Sidebar.js";
import { StatusBar } from "./components/StatusBar.js";
import { TitleBar } from "./components/TitleBar.js";
import { EnvPage } from "./pages/EnvPage.js";
import { RequestPage } from "./pages/RequestPage.js";
import { useStore } from "./store.js";
import {
	buildRequestIndexFallback,
	extractFolders,
	findFirstRequestPath,
} from "./utils/tree.js";

export function App() {
	const queryClient = useQueryClient();
	const {
		selectedPath,
		setSelectedPath,
		activeEnv,
		setActiveEnv,
		activeVersion,
		setActiveVersion,
		activeView,
		setActiveView,
		isNewRequestModalOpen,
		setIsNewRequestModalOpen,
		isNewFolderPromptOpen,
		setIsNewFolderPromptOpen,
		sidebarCollapsed,
		pendingPath,
		setPendingPath,
	} = useStore();

	const envInitialized = useRef(false);
	const autoSelected = useRef(false);

	const workspaceQuery = useQuery({
		queryKey: ["workspace"],
		queryFn: fetchWorkspace,
	});

	const tree = useMemo(
		() => workspaceQuery.data?.tree ?? [],
		[workspaceQuery.data?.tree],
	);

	const defaultVersionName =
		workspaceQuery.data?.manifest?.defaultVersionName || "default";

	const { versions, versionFolders } = useMemo(() => {
		const manifestVersions = workspaceQuery.data?.manifest?.versions || [];

		const detectedVersionFolders = new Set<string>();

		if (manifestVersions.length > 0) {
			for (const v of manifestVersions) {
				detectedVersionFolders.add(v);
			}
		}

		let hasUnversionedItems = false;
		for (const node of tree) {
			if (node.type === "folder") {
				detectedVersionFolders.add(node.name);
			} else if (node.type === "request") {
				hasUnversionedItems = true;
			}
		}

		const finalVersions = Array.from(detectedVersionFolders);
		if (hasUnversionedItems) {
			finalVersions.push(defaultVersionName);
		}

		return {
			versions: finalVersions,
			versionFolders: Array.from(detectedVersionFolders),
		};
	}, [tree, workspaceQuery.data?.manifest, defaultVersionName]);

	const versionTree = useMemo(() => {
		const folders = new Set(versionFolders);
		if (activeVersion === defaultVersionName) {
			return tree.filter((node) => !folders.has(node.name));
		}
		const node = tree.find((n) => n.name === activeVersion);
		return node?.type === "folder" ? node.children : [];
	}, [tree, activeVersion, defaultVersionName, versionFolders]);

	const activeVersionFolders = useMemo(() => {
		return extractFolders(versionTree);
	}, [versionTree]);

	useEffect(() => {
		if (!activeVersion && versions.length > 0) {
			setActiveVersion(versions[0]);
		} else if (!activeVersion && versions.length === 0) {
			setActiveVersion(defaultVersionName);
		}
	}, [versions, activeVersion, defaultVersionName, setActiveVersion]);

	const requestIndex = useMemo(() => {
		const fromApi = workspaceQuery.data?.requestIndex ?? [];
		if (fromApi.length > 0) return fromApi;
		return buildRequestIndexFallback(tree);
	}, [workspaceQuery.data?.requestIndex, tree]);

	const environments = workspaceQuery.data?.environments ?? [];
	const defaultEnv =
		workspaceQuery.data?.manifest.defaultEnv ?? environments[0] ?? "local";

	const effectiveEnv = activeEnv || defaultEnv;

	useEffect(() => {
		if (envInitialized.current || !workspaceQuery.data) return;
		const savedEnv = localStorage.getItem("dakiya_activeEnv");
		if (!savedEnv) {
			setActiveEnv(defaultEnv);
		}
		envInitialized.current = true;
	}, [workspaceQuery.data, defaultEnv, setActiveEnv]);

	useEffect(() => {
		if (autoSelected.current || !workspaceQuery.data) return;

		let path = selectedPath;
		if (path) {
			const index = workspaceQuery.data.requestIndex?.length
				? workspaceQuery.data.requestIndex
				: buildRequestIndexFallback(tree);
			const exists = index.some((r) => r.path === path);
			if (!exists) path = null;
		}

		if (!path) {
			const first = findFirstRequestPath(tree);
			if (first) {
				setSelectedPath(first);
			}
		}
		autoSelected.current = true;
	}, [workspaceQuery.data, selectedPath, tree, setSelectedPath]);

	const renameFolderMutation = useMutation({
		mutationFn: ({
			folderPath,
			newName,
		}: {
			folderPath: string;
			newName: string;
		}) => renameFolderAPI(folderPath, newName),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
			// Update selectedPath if it was inside the renamed folder
			if (selectedPath?.startsWith(`${data.oldPath}/`)) {
				setSelectedPath(data.newPath + selectedPath.slice(data.oldPath.length));
			}
		},
	});

	const createFolderMutation = useMutation({
		mutationFn: (folderPath: string) => createFolderAPI(folderPath),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
		},
	});

	const deleteFolderMutation = useMutation({
		mutationFn: (folderPath: string) => deleteFolderAPI(folderPath),
		onSuccess: (_data, folderPath) => {
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
			if (selectedPath?.startsWith(`${folderPath}/`)) {
				setSelectedPath(null);
			}
		},
	});

	const renameRequestMutation = useMutation({
		mutationFn: ({
			requestPath,
			newName,
		}: {
			requestPath: string;
			newName: string;
		}) => renameRequestAPI(requestPath, newName),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
			if (selectedPath)
				queryClient.invalidateQueries({ queryKey: ["request", selectedPath] });
		},
	});

	const deleteRequestMutation = useMutation({
		mutationFn: (requestPath: string) => deleteRequestAPI(requestPath),
		onSuccess: (_data, requestPath) => {
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
			if (selectedPath === requestPath) {
				setSelectedPath(null);
			}
		},
	});

	const moveRequestMutation = useMutation({
		mutationFn: ({
			requestPath,
			toFolder,
		}: {
			requestPath: string;
			toFolder: string;
		}) => moveRequestAPI(requestPath, toFolder),
		onSuccess: (data, { requestPath }) => {
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
			if (selectedPath === requestPath) {
				setSelectedPath(data.newPath);
			}
		},
	});

	const handleCreateRequest = async (path: string, method: string) => {
		const result = await createRequestAPI(`${path}/${method}`);
		workspaceQuery.refetch();
		setSelectedPath(result.relativeToCollections);
		setIsNewRequestModalOpen(false);
	};

	const openEnvManager = useCallback(() => {
		setActiveView("environments");
	}, [setActiveView]);

	const workspaceError = workspaceQuery.error;
	const workspaceName = workspaceQuery.data?.manifest.name ?? "Workspace";
	const requestName =
		requestIndex.find((r) => r.path === selectedPath)?.name ?? null;

	if (workspaceQuery.isLoading) {
		return (
			<div className="grid place-content-center h-screen p-8 text-center">
				<p>Loading workspace…</p>
			</div>
		);
	}

	if (workspaceError) {
		return (
			<div className="grid place-content-center h-screen p-8 text-center">
				<p className="text-destructive">
					{workspaceError instanceof Error
						? workspaceError.message
						: "Failed to load workspace"}
				</p>
				<p className="text-muted-foreground mt-2 mb-4">
					Run <code>dakiya serve</code> from a project with a{" "}
					<code>.dakiya/</code> folder.
				</p>
				<Button onClick={() => workspaceQuery.refetch()}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen">
			<TitleBar projectName={workspaceName} requestName={requestName} />

			<div className="flex flex-1 overflow-hidden">
				{!sidebarCollapsed && (
					<Sidebar
						tree={versionTree}
						requestIndex={requestIndex}
						environments={environments.length > 0 ? environments : [defaultEnv]}
						onManageEnv={openEnvManager}
						versions={versions}
						actions={
							{
								onFolderRename: (folderPath, newName) =>
									renameFolderMutation.mutate({ folderPath, newName }),
								onFolderDelete: (folderPath) =>
									deleteFolderMutation.mutate(folderPath),
								onRequestRename: (requestPath, newName) =>
									renameRequestMutation.mutate({ requestPath, newName }),
								onRequestDelete: (requestPath) =>
									deleteRequestMutation.mutate(requestPath),
								// Used internally by CollectionTree's move dialog
								_onMoveWithTarget: (requestPath: string, toFolder: string) =>
									moveRequestMutation.mutate({ requestPath, toFolder }),
							} as import("./components/CollectionTree.js").CollectionTreeActions & {
								_onMoveWithTarget?: (path: string, target: string) => void;
							}
						}
					/>
				)}

				<div className="flex flex-1 flex-col overflow-hidden min-w-0">
					{activeView === "environments" ? (
						<EnvPage
							environments={
								environments.length > 0 ? environments : [defaultEnv]
							}
						/>
					) : (
						<RequestPage effectiveEnv={effectiveEnv} />
					)}

					<StatusBar workspaceName={workspaceName} />
				</div>
			</div>

			{isNewFolderPromptOpen && (
				<PromptDialog
					title="Create New Folder"
					placeholder="Enter folder name (e.g. auth)"
					confirmText="Create"
					onConfirm={(name) => {
						const targetPath = activeVersion
							? `${activeVersion}/${name}`
							: name;
						createFolderMutation.mutate(targetPath);
						setIsNewFolderPromptOpen(false);
					}}
					onCancel={() => setIsNewFolderPromptOpen(false)}
				/>
			)}

			{isNewRequestModalOpen && (
				<NewRequestModal
					activeVersion={activeVersion}
					defaultVersionName={defaultVersionName}
					folders={activeVersionFolders}
					onClose={() => setIsNewRequestModalOpen(false)}
					onCreate={handleCreateRequest}
				/>
			)}

			{pendingPath && (
				<ConfirmDialog
					title="Discard Changes?"
					message={
						<p style={{ margin: 0 }}>
							You have unsaved changes. Are you sure you want to discard them?
						</p>
					}
					confirmText="Discard"
					isDestructive={true}
					onCancel={() => setPendingPath(null)}
					onConfirm={() => {
						setSelectedPath(pendingPath);
						setPendingPath(null);
					}}
				/>
			)}
		</div>
	);
}
