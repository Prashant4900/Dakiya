import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
	fetchEnvironment,
	fetchRequest,
	saveRequest,
	sendRequestApi,
} from "../api/client.js";
import { RequestPanel } from "../components/RequestPanel.js";
import { ResponsePanel } from "../components/ResponsePanel.js";
import { useStore } from "../store.js";

type RequestPageProps = {
	effectiveEnv: string;
};

export function RequestPage({ effectiveEnv }: RequestPageProps) {
	const queryClient = useQueryClient();
	const {
		selectedPath,
		sendResult,
		setSendResult,
		sendError,
		setSendError,
		setSaveError,
		responseCollapsed,
	} = useStore();

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

	const sendMutation = useMutation({
		mutationKey: ["sendRequest"],
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

	return (
		<RequestPanel
			request={requestQuery.data ?? null}
			loading={requestQuery.isLoading && Boolean(selectedPath)}
			error={
				requestQuery.error instanceof Error ? requestQuery.error.message : null
			}
			onSave={handleSave}
			onSend={handleSend}
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
	);
}
