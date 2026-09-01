import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ViewIcon, ViewOffSlashIcon } from "hugeicons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	createEnvironment,
	fetchEnvironment,
	saveEnvironment,
} from "../api/client.js";
import { KeyValueEditor, type KVRow } from "../components/KeyValueEditor.js";
import { PromptDialog } from "../components/PromptDialog.js";
import { useStore } from "../store.js";

// Keys whose names suggest secret values
const SECRET_PATTERNS =
	/token|secret|key|password|passwd|pwd|auth|api[-_]?key/i;

function isSensitiveKey(k: string): boolean {
	return SECRET_PATTERNS.test(k);
}

function jsonToVars(source: string): { key: string; value: string }[] {
	try {
		if (!source.trim()) return [];
		const parsed = JSON.parse(source);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
			return [];
		return Object.entries(parsed).map(([key, val]) => ({
			key,
			value: typeof val === "string" ? val : JSON.stringify(val),
		}));
	} catch {
		return [];
	}
}

function varsToJson(vars: { key: string; value: string }[]): string {
	const obj: Record<string, string> = {};
	for (const { key, value } of vars) {
		const trimmedKey = key.trim();
		if (trimmedKey) {
			obj[trimmedKey] = value;
		}
	}
	return `${JSON.stringify(obj, null, 2)}\n`;
}

type EnvRow = KVRow & { masked?: boolean };

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
		const vars = jsonToVars(data.source);
		const initRows: EnvRow[] = vars.map((v, i) => ({
			id: String(i),
			key: v.key,
			value: v.value,
			masked: isSensitiveKey(v.key),
		}));
		initRows.push({
			id: String(Date.now()),
			key: "",
			value: "",
			masked: false,
		});
		setRows(initRows);
		setRawSource(data.source);
		setDirty(false);
		setSaveError(null);
		initialized.current = true;
	}, [data]);

	// Keep raw JSON in sync when table changes
	useEffect(() => {
		if (!initialized.current || !data) return;
		const nonEmpty = rows.filter((r) => r.key.trim());
		setRawSource(varsToJson(nonEmpty));
	}, [rows, data]);

	const syncTableFromRaw = useCallback((source: string) => {
		setRawSource(source);
		const vars = jsonToVars(source);
		const newRows: EnvRow[] = vars.map((v, i) => ({
			id: String(i),
			key: v.key,
			value: v.value,
			masked: isSensitiveKey(v.key),
		}));
		newRows.push({ id: String(Date.now()), key: "", value: "", masked: false });
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
			: varsToJson(rows.filter((r) => r.key.trim()));
		saveMutation.mutate(source);
	};

	const handleRowsChange = (newRows: KVRow[]) => {
		const next = [...newRows];
		const lastRow = next[next.length - 1];
		if (lastRow && (lastRow.key || lastRow.value)) {
			next.push({ id: String(Date.now()), key: "", value: "", masked: false });
		}
		// Also update masked for any row whose key changed (this is a bit tricky if we just get newRows, but let's re-evaluate all rows)
		next.forEach((row) => {
			if (row.key && isSensitiveKey(row.key) && row.masked === undefined) {
				row.masked = true;
			}
		});
		setRows(next);
		setDirty(true);
	};

	if (isLoading) {
		return <div className="env-editor-loading">Loading environment…</div>;
	}
	if (error) {
		return (
			<div className="flex-1 flex items-center justify-center text-destructive">
				{error instanceof Error ? error.message : "Failed to load"}
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-background min-w-0">
			<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
				<div className="flex items-center gap-3">
					<span className="text-lg font-semibold tracking-tight">{name}</span>
					{name === activeEnv && (
						<span className="text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">
							● active
						</span>
					)}
				</div>
				<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
					{dirty && (
						<span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">
							unsaved
						</span>
					)}
					<Button
						disabled={!dirty || saveMutation.isPending}
						onClick={handleSave}
					>
						{saveMutation.isPending ? "Saving…" : "Save"}
					</Button>
				</div>
			</div>

			{saveError && (
				<p className="text-destructive text-sm px-6 py-4 bg-destructive/10 border-b border-destructive/20">
					{saveError}
				</p>
			)}

			<div className="flex-1 overflow-auto">
				<KeyValueEditor
					rows={rows}
					onChange={handleRowsChange}
					autoAppend={true}
					keyPlaceholder="variable_name"
					renderValue={(row, idx, update) => {
						const isLast = idx === rows.length - 1;
						const showMaskBtn =
							!isLast && row.key && isSensitiveKey(row.key) && row.value;
						return (
							<>
								<input
									className="kv-input"
									placeholder={isLast ? "value" : ""}
									type={row.masked && row.value ? "password" : "text"}
									value={row.value}
									onChange={(e) => update("value", e.target.value)}
									style={{ paddingRight: showMaskBtn ? "36px" : undefined }}
								/>
								{showMaskBtn && (
									<Button
										variant="ghost"
										size="icon"
										title={row.masked ? "Reveal" : "Mask"}
										onClick={() => update("masked", !row.masked)}
										className="h-8 w-8"
										style={{ position: "absolute", right: 0, top: 0 }}
									>
										{row.masked ? (
											<ViewIcon className="h-4 w-4" />
										) : (
											<ViewOffSlashIcon className="h-4 w-4" />
										)}
									</Button>
								)}
							</>
						);
					}}
				/>
			</div>

			{/* Collapsible raw JSON */}
			<div className="shrink-0 border-t border-border bg-card flex flex-col">
				<button
					type="button"
					className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full text-left"
					onClick={() => setRawOpen((v) => !v)}
				>
					<span className="text-[10px] w-4">{rawOpen ? "▾" : "▸"}</span>
					Raw JSON
				</button>
				{rawOpen && (
					<div className="w-full border-t border-border">
						<textarea
							className="w-full min-h-[160px] max-h-[320px] p-4 bg-muted border-none outline-none resize-y text-xs leading-relaxed text-foreground font-mono focus:bg-background transition-colors block"
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
};

export function EnvPage({ environments }: EnvPageProps) {
	const { activeEnv, setActiveEnv, setActiveView } = useStore();
	const onClose = useCallback(() => setActiveView("request"), [setActiveView]);
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
		<div className="flex flex-col h-full bg-background min-w-0">
			<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
				<h2 className="text-xl font-bold tracking-tight">Environments</h2>
				<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
					<Button variant="secondary" onClick={() => setNewEnvOpen(true)}>
						+ New
					</Button>
					<Button variant="ghost" onClick={onClose} title="Close (Esc)">
						Close
					</Button>
				</div>
			</div>

			<div className="flex flex-1 min-h-0 overflow-hidden">
				<aside className="w-[240px] border-r border-border bg-muted/30 flex flex-col shrink-0">
					<div className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase px-4 py-3 border-b border-border bg-card/50">
						ENVIRONMENTS
					</div>
					{allEnvs.length === 0 && (
						<p
							className="text-[11px] text-muted-foreground px-4 py-2 text-center"
							style={{ padding: "8px 12px" }}
						>
							No environments yet.
						</p>
					)}
					{allEnvs.map((name) => (
						<button
							key={name}
							type="button"
							className={`flex items-center gap-2 px-4 py-2.5 border-b border-border/50 text-sm font-medium hover:bg-card transition-colors cursor-pointer text-muted-foreground border-l-[3px] group ${name === selectedEnv ? "bg-card text-foreground border-l-primary" : "border-l-transparent"}`}
							onClick={() => setSelectedEnv(name)}
						>
							<span
								className="text-[8px] text-primary"
								style={{ opacity: name === activeEnv ? 1 : 0 }}
							>
								●
							</span>
							<span className="flex-1 text-left truncate">{name}</span>
							{name !== activeEnv && (
								<button
									type="button"
									className="opacity-0 group-hover:opacity-100 text-[10px] bg-muted hover:bg-muted-foreground/20 px-2 py-1 rounded transition-all"
									title={`Switch to ${name}`}
									onClick={(e) => {
										e.stopPropagation();
										setActiveEnv(name);
									}}
								>
									Use
								</button>
							)}
							{name === activeEnv && (
								<span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
									active
								</span>
							)}
						</button>
					))}
				</aside>

				<div className="flex-1 flex flex-col min-w-0 bg-background">
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
						<div className="flex-1 flex items-center justify-center text-muted-foreground">
							Select or create an environment to get started.
						</div>
					)}
				</div>
			</div>

			{newEnvOpen && (
				<PromptDialog
					title="New Environment"
					placeholder="e.g. staging"
					message="Enter a name. A JSON file will be created under .dakiya/environments/."
					confirmText="Create"
					onCancel={() => setNewEnvOpen(false)}
					onConfirm={(name: string) => {
						const safe = name.trim().replace(/[^a-zA-Z0-9_-]/g, "-");
						if (safe) createMutation.mutate(safe);
					}}
				/>
			)}
		</div>
	);
}
