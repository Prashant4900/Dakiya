import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	fetchEnvironment,
	fetchRequest,
	fetchWorkspace,
	saveEnvironment,
	saveRequest,
	sendRequestApi,
} from "./api/client.js";
import type { SendResponse } from "./api/types.js";
import { EnvEditor } from "./components/EnvSwitcher.js";
import { RequestPanel } from "./components/RequestPanel.js";
import { ResponsePanel } from "./components/ResponsePanel.js";
import { Sidebar } from "./components/Sidebar.js";
import { StatusBar } from "./components/StatusBar.js";
import { TitleBar } from "./components/TitleBar.js";
import {
	buildRequestIndexFallback,
	findFirstRequestPath,
} from "./utils/tree.js";

export function App() {
	const queryClient = useQueryClient();
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [activeEnv, setActiveEnv] = useState<string>("local");
	const [activeVersion, setActiveVersion] = useState<string | null>(null);
	const [sendResult, setSendResult] = useState<SendResponse | null>(null);
	const [sendError, setSendError] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [envSaveError, setEnvSaveError] = useState<string | null>(null);
	const [requestDirty, setRequestDirty] = useState(false);
	const [envEditorOpen, setEnvEditorOpen] = useState(false);
	const [envDraft, setEnvDraft] = useState("");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [responseCollapsed, setResponseCollapsed] = useState(false);
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

	const versions = useMemo(() => {
		return tree
			.filter((node) => node.type === "folder")
			.map((node) => node.name);
	}, [tree]);

	const manifestVersion = workspaceQuery.data?.manifest?.version?.toString();

	useEffect(() => {
		if (versions.length > 0 && !activeVersion) {
			let defaultVer = versions[0];
			if (manifestVersion && versions.includes(manifestVersion)) {
				defaultVer = manifestVersion;
			} else if (manifestVersion && versions.includes(`v${manifestVersion}`)) {
				defaultVer = `v${manifestVersion}`;
			} else if (versions.includes("v1")) {
				defaultVer = "v1";
			}
			setActiveVersion(defaultVer);
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
		setActiveEnv(defaultEnv);
		envInitialized.current = true;
	}, [workspaceQuery.data, defaultEnv]);

	useEffect(() => {
		if (autoSelected.current || !workspaceQuery.data || selectedPath) return;
		const first = findFirstRequestPath(tree);
		if (first) {
			setSelectedPath(first);
			autoSelected.current = true;
		}
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
		mutationFn: ({ path, source }: { path: string; source: string }) =>
			saveRequest(path, source),
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

	const handleSelect = useCallback(
		(path: string) => {
			if (
				requestDirty &&
				selectedPath &&
				path !== selectedPath &&
				!window.confirm("Discard unsaved changes?")
			) {
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
		async (source: string) => {
			if (!selectedPath) return;
			await saveMutation.mutateAsync({ path: selectedPath, source });
		},
		[selectedPath, saveMutation],
	);

	const handleSend = useCallback(() => {
		if (!selectedPath) return;
		sendMutation.mutate({ path: selectedPath, env: effectiveEnv });
	}, [selectedPath, effectiveEnv, sendMutation]);

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
				<button
					type="button"
					className="send-button"
					onClick={() => workspaceQuery.refetch()}
				>
					Retry
				</button>
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
		</div>
	);
}
