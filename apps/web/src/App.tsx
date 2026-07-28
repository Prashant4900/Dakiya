import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
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

export function App() {
	const queryClient = useQueryClient();
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const [activeEnv, setActiveEnv] = useState<string>("local");
	const [sendResult, setSendResult] = useState<SendResponse | null>(null);
	const [sendError, setSendError] = useState<string | null>(null);
	const [envEditorOpen, setEnvEditorOpen] = useState(false);
	const [envDraft, setEnvDraft] = useState("");

	const workspaceQuery = useQuery({
		queryKey: ["workspace"],
		queryFn: fetchWorkspace,
	});

	const environments = workspaceQuery.data?.environments ?? [];
	const requestIndex = workspaceQuery.data?.requestIndex ?? [];
	const defaultEnv =
		workspaceQuery.data?.manifest.defaultEnv ?? environments[0] ?? "local";

	const effectiveEnv = activeEnv || defaultEnv;

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
			queryClient.invalidateQueries({ queryKey: ["request", path] });
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
		},
	});

	const saveEnvMutation = useMutation({
		mutationFn: ({ name, source }: { name: string; source: string }) =>
			saveEnvironment(name, source),
		onSuccess: (_data, { name }) => {
			queryClient.invalidateQueries({ queryKey: ["environment", name] });
			setEnvEditorOpen(false);
		},
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

	const handleSelect = useCallback((path: string) => {
		setSelectedPath(path);
		setSendResult(null);
		setSendError(null);
	}, []);

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
		setEnvEditorOpen(true);
	}, [envQuery.data?.source]);

	const workspaceError = workspaceQuery.error;
	const tree = useMemo(
		() => workspaceQuery.data?.tree ?? [],
		[workspaceQuery.data?.tree],
	);

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
			</div>
		);
	}

	return (
		<div className="app-shell">
			<TitleBar projectName={workspaceName} requestName={requestName} />

			<div className="workspace">
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
				/>

				<div className="main-content">
					<RequestPanel
						request={requestQuery.data ?? null}
						loading={requestQuery.isLoading && Boolean(selectedPath)}
						error={
							requestQuery.error instanceof Error
								? requestQuery.error.message
								: null
						}
						onSave={handleSave}
						onSend={handleSend}
						sending={sendMutation.isPending}
						saving={saveMutation.isPending}
					>
						<ResponsePanel
							result={sendResult}
							error={sendError}
							loading={sendMutation.isPending}
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
