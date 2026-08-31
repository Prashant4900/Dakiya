import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	createEnvironment,
	fetchEnvironment,
	saveEnvironment,
} from "../api/client.js";
import { Button } from "@/components/ui/button";
import { Cancel01Icon, ViewIcon, ViewOffSlashIcon } from "hugeicons-react";
import { PromptDialog } from "./PromptDialog.js";

// Keys whose names suggest secret values
const SECRET_PATTERNS =
	/token|secret|key|password|passwd|pwd|auth|api[-_]?key/i;

function isSensitiveKey(k: string): boolean {
	return SECRET_PATTERNS.test(k);
}

function yamlToVars(source: string): { key: string; value: string }[] {
	const vars: { key: string; value: string }[] = [];
	for (const line of source.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const idx = trimmed.indexOf(":");
		if (idx === -1) continue;
		const k = trimmed.slice(0, idx).trim();
		const v = trimmed
			.slice(idx + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
		if (k) vars.push({ key: k, value: v });
	}
	return vars;
}

function varsToYaml(
	vars: { key: string; value: string }[],
	existingSource: string,
): string {
	// Preserve leading comments
	const commentLines: string[] = [];
	for (const line of existingSource.split("\n")) {
		const t = line.trim();
		if (t.startsWith("#")) commentLines.push(line);
		else break;
	}
	const dataLines = vars
		.filter((v) => v.key.trim())
		.map(({ key, value }) => {
			const needsQuote = /[:#[\]{},&*?|<>=!%@`\s]/.test(value) || value === "";
			const safeValue = needsQuote ? `"${value.replace(/"/g, '\\"')}"` : value;
			return `${key}: ${safeValue}`;
		});
	return [...commentLines, ...dataLines, ""].join("\n");
}

type EnvRow = { id: number; key: string; value: string; masked: boolean };

type EnvEditorPanelProps = {
	name: string;
	activeEnv: string;
	onSaved: () => void;
};

function EnvEditorPanel({ name, activeEnv, onSaved }: EnvEditorPanelProps) {
	const queryClient = useQueryClient();

	const { data, isLoading, error } = useQuery({
		queryKey: ["environment", name],
		queryFn: () => fetchEnvironment(name),
		enabled: Boolean(name),
	});

	const [rows, setRows] = useState<EnvRow[]>([]);
	const [rawOpen, setRawOpen] = useState(false);
	const [rawSource, setRawSource] = useState("");
	const [dirty, setDirty] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const initialized = useRef(false);

	useEffect(() => {
		if (!data) return;
		initialized.current = false;
		const vars = yamlToVars(data.source);
		const initRows: EnvRow[] = vars.map((v, i) => ({
			id: i,
			key: v.key,
			value: v.value,
			masked: isSensitiveKey(v.key),
		}));
		initRows.push({ id: Date.now(), key: "", value: "", masked: false });
		setRows(initRows);
		setRawSource(data.source);
		setDirty(false);
		setSaveError(null);
		initialized.current = true;
	}, [data]);

	// Keep raw YAML in sync when table changes
	useEffect(() => {
		if (!initialized.current || !data) return;
		const nonEmpty = rows.filter((r) => r.key.trim());
		setRawSource(varsToYaml(nonEmpty, data.source));
	}, [rows, data]);

	const syncTableFromRaw = useCallback((source: string) => {
		setRawSource(source);
		const vars = yamlToVars(source);
		const newRows: EnvRow[] = vars.map((v, i) => ({
			id: i,
			key: v.key,
			value: v.value,
			masked: isSensitiveKey(v.key),
		}));
		newRows.push({ id: Date.now(), key: "", value: "", masked: false });
		setRows(newRows);
		setDirty(true);
	}, []);

	const saveMutation = useMutation({
		mutationFn: (source: string) => saveEnvironment(name, source),
		onSuccess: () => {
			setSaveError(null);
			setDirty(false);
			queryClient.invalidateQueries({ queryKey: ["environment", name] });
			onSaved();
		},
		onError: (err: Error) => setSaveError(err.message),
	});

	const handleSave = () => {
		const source = rawOpen
			? rawSource
			: varsToYaml(
					rows.filter((r) => r.key.trim()),
					data?.source ?? "",
				);
		saveMutation.mutate(source);
	};

	const handleRowChange = (
		idx: number,
		field: "key" | "value",
		val: string,
	) => {
		const next = [...rows];
		next[idx] = { ...next[idx], [field]: val };
		if (field === "key") next[idx].masked = isSensitiveKey(val);
		if (idx === next.length - 1 && (next[idx].key || next[idx].value)) {
			next.push({ id: Date.now(), key: "", value: "", masked: false });
		}
		setRows(next);
		setDirty(true);
	};

	const handleRemove = (idx: number) => {
		const next = rows.filter((_, i) => i !== idx);
		if (
			next.length === 0 ||
			next[next.length - 1].key ||
			next[next.length - 1].value
		) {
			next.push({ id: Date.now(), key: "", value: "", masked: false });
		}
		setRows(next);
		setDirty(true);
	};

	const toggleMask = (idx: number) => {
		const next = [...rows];
		next[idx] = { ...next[idx], masked: !next[idx].masked };
		setRows(next);
	};

	if (isLoading) {
		return <div className="env-editor-loading">Loading environment…</div>;
	}
	if (error) {
		return (
			<div className="env-editor-loading error-text">
				{error instanceof Error ? error.message : "Failed to load"}
			</div>
		);
	}

	return (
		<div className="env-editor-panel">
			<div className="env-editor-panel-header">
				<div className="env-editor-panel-title">
					<span className="env-page-env-name">{name}</span>
					{name === activeEnv && (
						<span className="env-active-badge">● active</span>
					)}
				</div>
				<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
					{dirty && <span className="dirty-hint">unsaved</span>}
					<Button
						disabled={!dirty || saveMutation.isPending}
						onClick={handleSave}
					>
						{saveMutation.isPending ? "Saving…" : "Save"}
					</Button>
				</div>
			</div>

			{saveError && <p className="error-text env-editor-error">{saveError}</p>}

			<div className="env-var-table-wrap">
				<table className="kv-table editable-kv-table env-var-table">
					<thead>
						<tr>
							<th style={{ width: "38%" }}>Variable</th>
							<th>Value</th>
							<th className="kv-actions" />
						</tr>
					</thead>
					<tbody>
						{rows.map((row, idx) => {
							const isLast = idx === rows.length - 1;
							const showMaskBtn =
								!isLast && row.key && isSensitiveKey(row.key) && row.value;
							return (
								<tr key={row.id}>
									<td className="kv-key">
										<input
											className="kv-input"
											placeholder="variable_name"
											value={row.key}
											onChange={(e) =>
												handleRowChange(idx, "key", e.target.value)
											}
										/>
									</td>
									<td className="kv-val" style={{ position: "relative" }}>
										<input
											className="kv-input"
											placeholder={isLast ? "value" : ""}
											type={row.masked && row.value ? "password" : "text"}
											value={row.value}
											onChange={(e) =>
												handleRowChange(idx, "value", e.target.value)
											}
											style={{
												paddingRight: showMaskBtn ? "36px" : undefined,
											}}
										/>
										{showMaskBtn && (
											<Button
												variant="ghost"
												size="icon"
												title={row.masked ? "Reveal" : "Mask"}
												onClick={() => toggleMask(idx)}
												className="h-8 w-8"
											>
												{row.masked ? <ViewIcon className="h-4 w-4" /> : <ViewOffSlashIcon className="h-4 w-4" />}
											</Button>
										)}
									</td>
									<td className="kv-actions">
										{!isLast && (
											<Button
												className="kv-remove-btn"
												onClick={() => handleRemove(idx)}
												title="Remove variable"
												size="icon"
												variant="ghost"
											>
												<Cancel01Icon size={14} />
											</Button>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Collapsible raw YAML */}
			<div className="env-raw-section">
				<button
					type="button"
					className="env-raw-toggle"
					onClick={() => setRawOpen((v) => !v)}
				>
					<span className="env-raw-arrow">{rawOpen ? "▾" : "▸"}</span>
					Raw YAML
				</button>
				{rawOpen && (
					<div className="env-raw-editor">
						<textarea
							className="env-raw-textarea mono"
							value={rawSource}
							onChange={(e) => syncTableFromRaw(e.target.value)}
							spellCheck={false}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

type EnvPageProps = {
	environments: string[];
	activeEnv: string;
	onClose: () => void;
	onEnvChange: (name: string) => void;
};

export function EnvPage({
	environments,
	activeEnv,
	onClose,
	onEnvChange,
}: EnvPageProps) {
	const queryClient = useQueryClient();
	const [selectedEnv, setSelectedEnv] = useState<string>(
		() => activeEnv || environments[0] || "",
	);
	const [newEnvOpen, setNewEnvOpen] = useState(false);
	const [allEnvs, setAllEnvs] = useState<string[]>(environments);

	useEffect(() => {
		setAllEnvs(environments);
	}, [environments]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	const createMutation = useMutation({
		mutationFn: (name: string) => createEnvironment(name),
		onSuccess: (_data, name) => {
			setAllEnvs((prev) => (prev.includes(name) ? prev : [...prev, name]));
			setSelectedEnv(name);
			queryClient.invalidateQueries({ queryKey: ["workspace"] });
			queryClient.invalidateQueries({ queryKey: ["environment", name] });
			setNewEnvOpen(false);
		},
	});

	return (
		<div className="env-page">
			<div className="env-page-header">
				<h2 className="env-page-title">Environments</h2>
				<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
					<Button variant="secondary" onClick={() => setNewEnvOpen(true)}>
						+ New
					</Button>
					<Button variant="ghost" onClick={onClose} title="Close (Esc)">
						Close
					</Button>
				</div>
			</div>

			<div className="env-page-body">
				<aside className="env-list">
					<div className="env-list-label">ENVIRONMENTS</div>
					{allEnvs.length === 0 && (
						<p className="empty-hint" style={{ padding: "8px 12px" }}>
							No environments yet.
						</p>
					)}
					{allEnvs.map((name) => (
						<button
							key={name}
							type="button"
							className={`env-list-item${name === selectedEnv ? " active" : ""}`}
							onClick={() => setSelectedEnv(name)}
						>
							<span
								className="env-list-dot"
								style={{ opacity: name === activeEnv ? 1 : 0 }}
							>
								●
							</span>
							<span className="env-list-name">{name}</span>
							{name !== activeEnv && (
								<button
									type="button"
									className="env-list-use-btn"
									title={`Switch to ${name}`}
									onClick={(e) => {
										e.stopPropagation();
										onEnvChange(name);
									}}
								>
									Use
								</button>
							)}
							{name === activeEnv && (
								<span className="env-list-use-badge">active</span>
							)}
						</button>
					))}
				</aside>

				<div className="env-editor-area">
					{selectedEnv ? (
						<EnvEditorPanel
							key={selectedEnv}
							name={selectedEnv}
							activeEnv={activeEnv}
							onSaved={() =>
								queryClient.invalidateQueries({
									queryKey: ["environment", selectedEnv],
								})
							}
						/>
					) : (
						<div className="env-editor-empty">
							Select or create an environment to get started.
						</div>
					)}
				</div>
			</div>

			{newEnvOpen && (
				<PromptDialog
					title="New Environment"
					placeholder="e.g. staging"
					message="Enter a name. A YAML file will be created under .dakiya/environments/."
					confirmText="Create"
					onCancel={() => setNewEnvOpen(false)}
					onConfirm={(name) => {
						const safe = name.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
						if (safe) createMutation.mutate(safe);
					}}
				/>
			)}
		</div>
	);
}
