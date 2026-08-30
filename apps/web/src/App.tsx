import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	createFolderAPI,
	createRequestAPI,
	deleteFolderAPI,
	deleteRequestAPI,
	fetchEnvironment,
	fetchRequest,
	fetchWorkspace,
	moveRequestAPI,
	renameFolderAPI,
	renameRequestAPI,
	saveEnvironment,
	saveRequest,
	sendRequestApi,
} from "./api/client.js";
import type { SendResponse } from "./api/types.js";
import { Button } from "./components/Button.js";
import { ConfirmDialog } from "./components/ConfirmDialog.js";
import { EnvEditor } from "./components/EnvSwitcher.js";
import { NewRequestModal } from "./components/NewRequestModal.js";
import { PromptDialog } from "./components/PromptDialog.js";
import { RequestPanel } from "./components/RequestPanel.js";
import { ResponsePanel } from "./components/ResponsePanel.js";
import { Sidebar } from "./components/Sidebar.js";
import { StatusBar } from "./components/StatusBar.js";
import { TitleBar } from "./components/TitleBar.js";
import {
	buildRequestIndexFallback,
	extractFolders,
	findFirstRequestPath,
} from "./utils/tree.js";

export function App() {
	const queryClient = useQueryClient();
	const [selectedPath, setSelectedPath] = useState<string | null>(() =>
		localStorage.getItem("dakiya_selectedPath"),
	);
	const [activeEnv, setActiveEnv] = useState<string>(
		() => localStorage.getItem("dakiya_activeEnv") || "local",
	);
	const [activeVersion, setActiveVersion] = useState<string | null>(() =>
		localStorage.getItem("dakiya_activeVersion"),
	);
	const [sendResult, setSendResult] = useState<SendResponse | null>(null);
	const [sendError, setSendError] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [envSaveError, setEnvSaveError] = useState<string | null>(null);
	const [requestDirty, setRequestDirty] = useState(false);
	const [envEditorOpen, setEnvEditorOpen] = useState(false);
	const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
	const [envDraft, setEnvDraft] = useState("");
	const [isNewFolderPromptOpen, setIsNewFolderPromptOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [responseCollapsed, setResponseCollapsed] = useState(false);
	const [pendingPath, setPendingPath] = useState<string | null>(null);
	const envInitialized = useRef(false);
	const autoSelected = useRef(false);

	useEffect(() => {
		if (selectedPath) localStorage.setItem("dakiya_selectedPath", selectedPath);
	}, [selectedPath]);

	useEffect(() => {
		if (activeEnv) localStorage.setItem("dakiya_activeEnv", activeEnv);
	}, [activeEnv]);

	useEffect(() => {
		if (activeVersion)
			localStorage.setItem("dakiya_activeVersion", activeVersion);
	}, [activeVersion]);

	const workspaceQuery = useQuery({
		queryKey: ["workspace"],
		queryFn: fetchWorkspace,
	});

	const tree = useMemo(
		() => workspaceQuery.data?.tree ?? [],
		[workspaceQuery.data?.tree],
	);

	const versions = useMemo(() => {
		return tree
			.filter((node) => node.type === "folder")
			.map((node) => node.name);
	}, [tree]);

	const versionTree = useMemo(() => {
		const node = tree.find((n) => n.name === activeVersion);
		return node?.type === "folder" ? node.children : [];
	}, [tree, activeVersion]);

	const activeVersionFolders = useMemo(() => {
		return extractFolders(versionTree);
	}, [versionTree]);

	const manifestVersion = workspaceQuery.data?.manifest?.version?.toString();

	useEffect(() => {
		if (!activeVersion) {
			if (versions.length > 0) {
				let defaultVer = versions[0];
				if (manifestVersion && versions.includes(manifestVersion)) {
					defaultVer = manifestVersion;
				} else if (
					manifestVersion &&
					versions.includes(`v${manifestVersion}`)
				) {
					defaultVer = `v${manifestVersion}`;
				} else if (versions.includes("v1")) {
					defaultVer = "v1";
				}
				setActiveVersion(defaultVer);
			} else if (manifestVersion) {
				setActiveVersion(
					manifestVersion.startsWith("v")
						? manifestVersion
						: `v${manifestVersion}`,
				);
			} else {
				setActiveVersion("v1");
			}
		}
	}, [versions, activeVersion, manifestVersion]);

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
	}, [workspaceQuery.data, defaultEnv]);

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
	}, [workspaceQuery.data, selectedPath, tree]);

	const requestQuery = useQuery({
		queryKey: ["request", selectedPath],
		queryFn: () => fetchRequest(selectedPath as string),
		enabled: Boolean(selectedPath),
	});

	const envQuery = useQuery({
		queryKey: ["environment", effectiveEnv],
		queryFn: () => fetchEnvironment(effectiveEnv),
		enabled: Boolean(effectiveEnv),
	});

	const saveMutation = useMutation({
		mutationFn: ({
			path,
			updates,
		}: {
			path: string;
			updates: Record<string, unknown>;
		}) => saveRequest(path, updates),
		onSuccess: (_data, { path }) => {
			setSaveError(null);
			queryClient.invalidateQueries({ queryKey: ["request", path] });
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
		},
		onError: (err: Error) => setSaveError(err.message),
	});

	const saveEnvMutation = useMutation({
		mutationFn: ({ name, source }: { name: string; source: string }) =>
			saveEnvironment(name, source),
		onSuccess: (_data, { name }) => {
			setEnvSaveError(null);
			queryClient.invalidateQueries({ queryKey: ["environment", name] });
			setEnvEditorOpen(false);
		},
		onError: (err: Error) => setEnvSaveError(err.message),
	});

	const sendMutation = useMutation({
		mutationFn: ({ path, env }: { path: string; env: string }) =>
			sendRequestApi(path, env),
		onSuccess: (data) => {
			setSendResult(data);
			setSendError(null);
			if (Object.keys(data.persistedVariables).length > 0) {
				queryClient.invalidateQueries({
					queryKey: ["environment", data.env],
				});
			}
		},
		onError: (err: Error) => {
			setSendError(err.message);
			setSendResult(null);
		},
	});

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
				setSendResult(null);
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
				setSendResult(null);
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

	const handleSelect = useCallback(
		(path: string) => {
			if (requestDirty && selectedPath && path !== selectedPath) {
				setPendingPath(path);
				return;
			}
			setSelectedPath(path);
			setSendResult(null);
			setSendError(null);
			setSaveError(null);
		},
		[requestDirty, selectedPath],
	);

	const handleSave = useCallback(
		async (updates: Record<string, unknown>) => {
			if (!selectedPath) return;
			await saveMutation.mutateAsync({ path: selectedPath, updates });
		},
		[selectedPath, saveMutation],
	);

	const handleSend = useCallback(() => {
		if (!selectedPath) return;
		sendMutation.mutate({ path: selectedPath, env: effectiveEnv });
	}, [selectedPath, effectiveEnv, sendMutation]);

	const handleCreateRequest = async (path: string, method: string) => {
		const result = await createRequestAPI(`${path}/${method}`);
		workspaceQuery.refetch();
		setSelectedPath(result.relativeToCollections);
		setIsNewRequestModalOpen(false);
	};

	const openEnvEditor = useCallback(() => {
		setEnvDraft(envQuery.data?.source ?? "");
		setEnvSaveError(null);
		setEnvEditorOpen(true);
	}, [envQuery.data?.source]);

	const workspaceError = workspaceQuery.error;
	const workspaceName = workspaceQuery.data?.manifest.name ?? "Workspace";
	const requestName =
		requestQuery.data?.document.meta.name ??
		requestIndex.find((r) => r.path === selectedPath)?.name ??
		null;

	if (workspaceQuery.isLoading) {
		return (
			<div className="app-loading">
				<p>Loading workspace…</p>
			</div>
		);
	}

	if (workspaceError) {
		return (
			<div className="app-loading">
				<p className="error-text">
					{workspaceError instanceof Error
						? workspaceError.message
						: "Failed to load workspace"}
				</p>
				<p className="muted">
					Run <code>dakiya serve</code> from a project with a{" "}
					<code>.dakiya/</code> folder.
				</p>
				<Button onClick={() => workspaceQuery.refetch()}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="app-shell">
			<TitleBar
				projectName={workspaceName}
				requestName={requestName}
				sidebarCollapsed={sidebarCollapsed}
				onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
				responseCollapsed={responseCollapsed}
				onToggleResponse={() => setResponseCollapsed((c) => !c)}
			/>

			<div className="workspace">
				{!sidebarCollapsed && (
					<Sidebar
						workspaceName={workspaceName}
						tree={tree}
						requestIndex={requestIndex}
						selectedPath={selectedPath}
						onSelect={handleSelect}
						environments={environments.length > 0 ? environments : [defaultEnv]}
						activeEnv={effectiveEnv}
						onEnvChange={setActiveEnv}
						onEditEnv={openEnvEditor}
						versions={versions}
						activeVersion={activeVersion}
						onVersionChange={setActiveVersion}
						onNewRequest={() => setIsNewRequestModalOpen(true)}
						onNewFolder={() => setIsNewFolderPromptOpen(true)}
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

				<div className="main-content">
					<RequestPanel
						request={requestQuery.data ?? null}
						loading={requestQuery.isLoading && Boolean(selectedPath)}
						error={
							requestQuery.error instanceof Error
								? requestQuery.error.message
								: null
						}
						saveError={saveError}
						onSave={handleSave}
						onSend={handleSend}
						onDirtyChange={setRequestDirty}
						sending={sendMutation.isPending}
						saving={saveMutation.isPending}
						activeEnvVariables={envQuery.data?.environment.variables ?? {}}
					>
						<ResponsePanel
							result={sendResult}
							error={sendError}
							loading={sendMutation.isPending}
							collapsed={responseCollapsed}
						/>
					</RequestPanel>

					<StatusBar
						workspaceName={workspaceName}
						activeEnv={effectiveEnv}
						sending={sendMutation.isPending}
					/>
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

			{envEditorOpen && (
				<EnvEditor
					name={effectiveEnv}
					source={envDraft}
					error={envSaveError}
					onChange={setEnvDraft}
					onSave={() =>
						saveEnvMutation.mutate({
							name: effectiveEnv,
							source: envDraft,
						})
					}
					onClose={() => setEnvEditorOpen(false)}
					saving={saveEnvMutation.isPending}
				/>
			)}

			{isNewRequestModalOpen && (
				<NewRequestModal
					activeVersion={activeVersion}
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
						setSendResult(null);
						setSendError(null);
						setSaveError(null);
						setPendingPath(null);
					}}
				/>
			)}
		</div>
	);
}
