import type { HttpMethod, RequestBody } from "@core/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Delete02Icon } from "hugeicons-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { createScript, deleteScript, saveScript } from "../api/client.js";
import type { RequestDocument, RequestResponse } from "../api/types.js";
import { useStore } from "../store.js";
import { formatExamples } from "../utils/format.js";
import { methodColorVar } from "../utils/method.js";
import { BodyEditor } from "./BodyEditor.js";
import { CodeEditor } from "./CodeEditor.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { KeyValueEditor, type KVRow } from "./KeyValueEditor.js";
import { PaneHeader } from "./PaneHeader.js";
import { Tabs } from "./Tabs.js";

const COMMON_HEADERS = [
	"Accept",
	"Accept-Charset",
	"Accept-Encoding",
	"Accept-Language",
	"Authorization",
	"Cache-Control",
	"Connection",
	"Content-Length",
	"Content-Type",
	"Cookie",
	"Date",
	"Expect",
	"Forwarded",
	"From",
	"Host",
	"If-Match",
	"If-Modified-Since",
	"If-None-Match",
	"If-Range",
	"If-Unmodified-Since",
	"Max-Forwards",
	"Origin",
	"Pragma",
	"Proxy-Authorization",
	"Range",
	"Referer",
	"TE",
	"User-Agent",
	"Upgrade",
	"Via",
	"Warning",
	"X-Requested-With",
	"X-Forwarded-For",
	"X-Forwarded-Host",
	"X-Forwarded-Proto",
];

const COMMON_CONTENT_TYPES = [
	"application/json",
	"application/x-www-form-urlencoded",
	"multipart/form-data",
	"text/html",
	"text/plain",
	"application/xml",
];

const COMMON_ACCEPTS = ["application/json", "text/html", "*/*"];

export type EditorTab =
	| "body"
	| "headers"
	| "docs"
	| "pre-script"
	| "post-script"
	| "examples";

type RequestPanelProps = {
	request: RequestResponse | null;
	loading: boolean;
	error: string | null;
	onSave: (updates: Record<string, unknown>) => Promise<void>;
	onSend: () => void;
	sending: boolean;
	saving: boolean;
	activeEnvVariables: Record<string, string>;
	children?: ReactNode;
};

// Component for a single variable token with popover
function EnvVarToken({
	varName,
	val,
}: {
	varName: string;
	val: string | undefined;
}) {
	const [rect, setRect] = useState<DOMRect | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const timeoutRef = useRef<number | null>(null);

	const handleMouseEnter = (e: React.SyntheticEvent) => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setRect(e.currentTarget.getBoundingClientRect());
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = window.setTimeout(() => {
			setIsHovered(false);
		}, 100);
	};

	const handlePopoverEnter = () => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setIsHovered(true);
	};

	const isResolved = val !== undefined;

	return (
		<>
			<button
				type="button"
				className={`inline-flex items-center px-1 py-0 border rounded text-[11px] font-medium font-mono leading-snug transition-colors ${
					isResolved
						? "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20"
						: "text-destructive bg-destructive/10 border-destructive/20 hover:bg-destructive/20"
				}`}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onFocus={handleMouseEnter}
				onBlur={handleMouseLeave}
				style={{
					font: "inherit",
					cursor: "pointer",
				}}
			>
				{`{{${varName}}}`}
			</button>
			{isHovered &&
				rect &&
				createPortal(
					<div
						role="tooltip"
						className="fixed z-[1000] bg-popover text-popover-foreground border border-border rounded-md shadow-md w-[280px] text-xs overflow-hidden animate-in fade-in zoom-in-95"
						style={{
							top: rect.bottom + 6,
							left: Math.min(rect.left, window.innerWidth - 340),
						}}
						onMouseEnter={handlePopoverEnter}
						onMouseLeave={handleMouseLeave}
						onFocus={handlePopoverEnter}
						onBlur={handleMouseLeave}
					>
						<div className="p-2.5 bg-card">
							<input
								readOnly
								value={isResolved ? val : "Unresolved Variable"}
								className={`w-full bg-transparent border-none outline-none font-mono text-xs ${!isResolved ? "text-destructive" : "text-foreground"}`}
							/>
						</div>
						<div className="px-3 py-2 bg-muted border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
							<div className="flex items-center gap-1.5">
								<span className="w-[18px] h-[18px] rounded flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary">
									E
								</span>{" "}
								Environment
							</div>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}

// Helper component to render text with {{variables}} highlighted
function EnvHighlight({
	text,
	variables,
}: {
	text: string;
	variables: Record<string, string>;
}) {
	const parts = useMemo(() => {
		if (!text) return [];
		return text.split(/(\{\{[^}]+\}\})/g).map((part) => ({
			id: crypto.randomUUID(),
			text: part,
		}));
	}, [text]);

	if (!text) return null;

	return (
		<>
			{parts.map((part) => {
				if (part.text.startsWith("{{") && part.text.endsWith("}}")) {
					const varName = part.text.slice(2, -2).trim();
					const val = variables[varName];
					return <EnvVarToken key={part.id} varName={varName} val={val} />;
				}
				return <span key={part.id}>{part.text}</span>;
			})}
		</>
	);
}

function EnvEditableCell({
	value,
	placeholder,
	onChange,
	variables,
	list,
}: {
	value: string;
	placeholder: string;
	onChange: (val: string) => void;
	variables: Record<string, string>;
	list?: string;
}) {
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isFocused && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isFocused]);

	if (isFocused || !value) {
		return (
			<input
				ref={inputRef}
				type="text"
				className="kv-input"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onBlur={() => setIsFocused(false)}
				list={list}
			/>
		);
	}

	return (
		<button
			type="button"
			className="kv-editable-cell"
			aria-label={placeholder || "Edit value"}
			onClick={() => setIsFocused(true)}
			style={{
				display: "block",
				width: "100%",
				background: "transparent",
				border: "none",
				padding: 0,
				textAlign: "left",
				font: "inherit",
				color: "inherit",
				cursor: "text",
			}}
		>
			<div className="kv-cell-preview">
				<EnvHighlight text={value} variables={variables} />
			</div>
		</button>
	);
}

export function RequestPanel({
	request,
	loading,
	error,
	onSave,
	onSend,
	sending,
	saving,
	activeEnvVariables,
	children,
}: RequestPanelProps) {
	const { saveError, setRequestDirty } = useStore();
	const [tab, setTab] = useState<EditorTab>(() => {
		const saved = localStorage.getItem("dakiya_requestTab");
		return (saved as EditorTab) || "body";
	});

	useEffect(() => {
		localStorage.setItem("dakiya_requestTab", tab);
	}, [tab]);

	const [localBody, setLocalBody] = useState<RequestBody | undefined>(
		undefined,
	);
	const [dirty, setDirty] = useState(false);
	const [localHeaders, setLocalHeaders] = useState<KVRow[]>([]);
	const [parseError, setParseError] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const [draftPreScript, setDraftPreScript] = useState("");
	const [draftPostScript, setDraftPostScript] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState<"pre" | "post" | null>(
		null,
	);
	const [localUrl, setLocalUrl] = useState("");
	const [localMethod, setLocalMethod] = useState<HttpMethod>("GET");
	const [isUrlFocused, setIsUrlFocused] = useState(false);
	const urlInputRef = useRef<HTMLInputElement>(null);

	const createScriptMutation = useMutation({
		mutationFn: ({ type }: { type: "pre" | "post" }) =>
			createScript(request?.relativePath ?? "", type),
		onSuccess: () => {
			if (request)
				queryClient.invalidateQueries({
					queryKey: ["request", request.relativePath],
				});
		},
	});

	const _saveScriptMutation = useMutation({
		mutationFn: ({ type, source }: { type: "pre" | "post"; source: string }) =>
			saveScript(request?.relativePath ?? "", type, source),
		onSuccess: () => {
			if (request)
				queryClient.invalidateQueries({
					queryKey: ["request", request.relativePath],
				});
		},
	});

	const deleteScriptMutation = useMutation({
		mutationFn: ({ type }: { type: "pre" | "post" }) =>
			deleteScript(request?.relativePath ?? "", type),
		onSuccess: () => {
			if (request)
				queryClient.invalidateQueries({
					queryKey: ["request", request.relativePath],
				});
		},
	});

	useEffect(() => {
		if (request) {
			setLocalBody(request.document?.body);
			setDraftPreScript(request.document?.pre?.source ?? "");
			setDraftPostScript(request.document?.post?.source ?? "");
			setLocalUrl(request.document?.request.url ?? "");
			setLocalMethod((request.document?.request.method as HttpMethod) ?? "GET");
			setDirty(false);
		}
	}, [request]);

	useEffect(() => {
		setRequestDirty(dirty);
	}, [dirty, setRequestDirty]);

	const doc: RequestDocument | undefined = request?.document;

	const _method = doc?.request.method ?? "GET";
	const _url = doc?.request.url ?? "";
	// Actually, it's safer to only sync when tab changes or request ID changes.

	// Let's refactor the useEffect to only run when tab changes or request ID changes.

	const handleSave = async () => {
		const headersObj = localHeaders.reduce(
			(acc, h) => {
				if (h.key) acc[h.key] = h.value;
				return acc;
			},
			{} as Record<string, string>,
		);
		await onSave({
			url: localUrl,
			method: localMethod,
			body: localBody,
			headers: headersObj,
		});
		setDirty(false);
	};

	const handleSend = useCallback(async () => {
		if (dirty) {
			const headersObj = localHeaders.reduce(
				(acc, h) => {
					if (h.key) acc[h.key] = h.value;
					return acc;
				},
				{} as Record<string, string>,
			);
			await onSave({
				url: localUrl,
				method: localMethod,
				body: localBody,
				headers: headersObj,
			});
			setDirty(false);
		}
		onSend();
	}, [dirty, localBody, localHeaders, localUrl, localMethod, onSave, onSend]);

	const handleBodyChange = (newBody: RequestBody | undefined) => {
		setLocalBody(newBody);
		setDirty(true);

		if (!newBody) return;

		let autoContentType = "";
		if (typeof newBody === "object") {
			if (newBody.type === "raw" && newBody.raw) {
				const format = newBody.raw.format;
				if (format === "json") autoContentType = "application/json";
				else if (format === "xml") autoContentType = "application/xml";
				else if (format === "html") autoContentType = "text/html";
				else if (format === "javascript")
					autoContentType = "application/javascript";
				else autoContentType = "text/plain";
			} else if (newBody.type === "graphql") {
				autoContentType = "application/json";
			} else if (newBody.type === "urlencoded") {
				autoContentType = "application/x-www-form-urlencoded";
			}
		}

		if (autoContentType) {
			setLocalHeaders((prev) => {
				const hasContentType = prev.some(
					(h) => h.key.toLowerCase() === "content-type",
				);
				if (!hasContentType) {
					const newHeaders = [...prev];
					// Remove the trailing empty row if it exists
					if (
						newHeaders.length > 0 &&
						!newHeaders[newHeaders.length - 1].key &&
						!newHeaders[newHeaders.length - 1].value
					) {
						newHeaders.pop();
					}
					newHeaders.push({
						id: String(Date.now()),
						key: "Content-Type",
						value: autoContentType,
					});
					newHeaders.push({ id: String(Date.now() + 1), key: "", value: "" }); // Add trailing empty row
					return newHeaders;
				}
				return prev;
			});
		}
	};

	const _updateDraftHeaders = () => {
		setDirty(true);
	};

	const handleHeadersChange = (newHeaders: KVRow[]) => {
		const next = [...newHeaders];
		const lastRow = next[next.length - 1];
		if (lastRow && (lastRow.key || lastRow.value)) {
			next.push({ id: String(Date.now()), key: "", value: "" });
		}
		setLocalHeaders(next);
		setDirty(true);
	};

	const isEditingHeaders = useRef(false);
	useEffect(() => {
		if (tab === "headers" && !isEditingHeaders.current && doc) {
			const h = Object.entries(doc.request.headers || {}).map(([k, v], i) => ({
				id: String(i),
				key: k,
				value: String(v),
			}));
			// ALWAYS add a trailing empty row so users can start typing new headers
			h.push({ id: String(Date.now()), key: "", value: "" });
			setLocalHeaders(h);
			setParseError(null);
		}
	}, [tab, doc]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				if (!sending && !saving && request) {
					void handleSend();
				}
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [handleSend, request, sending, saving]);

	const tabs: { id: EditorTab; label: string; badge?: number }[] = doc
		? [
				{ id: "body", label: "Body" },
				{
					id: "headers",
					label: "Headers",
					badge: Object.keys(doc.request.headers).length || undefined,
				},
				{ id: "docs", label: "Docs" },
				{ id: "pre-script", label: "Pre-script" },
				{ id: "post-script", label: "Post-script" },
			]
		: [];

	if (doc?.examples?.length) {
		tabs.push({
			id: "examples",
			label: "Examples",
			badge: doc.examples.length,
		});
	}

	const showEditor = Boolean(request && !loading && !error);

	return (
		<>
			<div className="flex items-center px-4 py-2 border-b bg-card gap-2 shrink-0">
				<select
					className="bg-muted border border-border rounded-md px-2.5 py-1.5 text-xs font-bold font-mono min-w-[80px] text-center cursor-pointer outline-none focus:border-primary transition-colors text-foreground"
					style={{ color: methodColorVar(localMethod) }}
					value={localMethod}
					onChange={(e) => {
						setLocalMethod(e.target.value as HttpMethod);
						setDirty(true);
					}}
					disabled={!request || loading}
				>
					<option value="GET">GET</option>
					<option value="POST">POST</option>
					<option value="PUT">PUT</option>
					<option value="PATCH">PATCH</option>
					<option value="DELETE">DELETE</option>
					<option value="HEAD">HEAD</option>
					<option value="OPTIONS">OPTIONS</option>
				</select>
				<div className="flex-1 flex items-center min-w-0 relative cursor-text">
					<label
						className={`flex items-center w-full bg-muted border rounded-md px-3 h-8 transition-colors ${
							isUrlFocused
								? "border-primary ring-2 ring-primary/20"
								: "border-border"
						}`}
					>
						<input
							ref={urlInputRef}
							type="text"
							className={`flex-1 bg-transparent border-none outline-none text-xs text-foreground font-mono h-full min-w-0 ${
								isUrlFocused ? "px-1" : "sr-only"
							}`}
							placeholder="Enter request URL or {{variable}}"
							value={localUrl}
							onChange={(e) => {
								setLocalUrl(e.target.value);
								setDirty(true);
							}}
							onFocus={() => setIsUrlFocused(true)}
							onBlur={() => setIsUrlFocused(false)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									void handleSend();
								} else if (e.key === "Escape") {
									setIsUrlFocused(false);
									urlInputRef.current?.blur();
								}
							}}
						/>
						{!isUrlFocused && (
							<div className="flex-1 overflow-hidden truncate text-xs font-mono px-1">
								{localUrl ? (
									<EnvHighlight
										text={localUrl}
										variables={activeEnvVariables}
									/>
								) : (
									<span className="text-muted-foreground">
										{request
											? "Enter request URL or {{variable}}"
											: "Select a request"}
									</span>
								)}
							</div>
						)}
					</label>
				</div>
				<Button
					onClick={() => void handleSend()}
					disabled={sending || saving || !request || loading}
					title="Send (⌘↵)"
				>
					{sending ? "Sending…" : "Send"}
				</Button>
				<Button
					variant="secondary"
					onClick={handleSave}
					disabled={!dirty || saving || !request}
				>
					{saving ? "Saving…" : "Save"}
				</Button>
			</div>

			{(saveError || error) && (
				<div className="p-4 text-xs text-destructive border-b">
					{saveError && <p>{saveError}</p>}
					{error && !loading && <p>{error}</p>}
				</div>
			)}

			{showEditor && (
				<Tabs
					tabs={tabs}
					activeTab={tab}
					onChange={setTab as (id: string) => void}
				>
					{dirty && (
						<span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">
							unsaved
						</span>
					)}
				</Tabs>
			)}

			<div className="flex flex-1 min-h-0 overflow-hidden">
				<div className="flex flex-col h-full bg-background flex-1 min-w-0 border-r border-border">
					{loading && (
						<div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
							Loading request…
						</div>
					)}

					{!request && !loading && (
						<div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
							Select a request from the sidebar
						</div>
					)}

					{error && !loading && request === null && (
						<div className="flex-1 flex items-center justify-center text-destructive text-xs">
							{error}
						</div>
					)}

					{showEditor && tab === "body" && (
						<BodyEditor
							body={localBody}
							onChange={handleBodyChange}
							variables={activeEnvVariables}
						/>
					)}

					{showEditor && tab === "headers" && (
						<>
							<PaneHeader title="Request headers" tag="KV" />

							{parseError ? (
								<div className="p-4 text-destructive text-xs">{parseError}</div>
							) : (
								<div className="flex-1 flex flex-col h-full border border-border border-t-0 overflow-hidden">
									<KeyValueEditor
										rows={localHeaders}
										onChange={handleHeadersChange}
										autoAppend={true}
										keyPlaceholder="Header"
										onFocus={() => {
											isEditingHeaders.current = true;
										}}
										onBlur={(e) => {
											if (!e.currentTarget.contains(e.relatedTarget as Node)) {
												isEditingHeaders.current = false;
											}
										}}
										renderKey={(h, _i, update) => (
											<EnvEditableCell
												placeholder="Header"
												value={h.key}
												onChange={(val) => update("key", val)}
												variables={activeEnvVariables}
												list="common-headers"
											/>
										)}
										renderValue={(h, _i, update) => {
											const keyLower = h.key.toLowerCase();
											const valueListId =
												keyLower === "content-type"
													? "content-types"
													: keyLower === "accept"
														? "accept-types"
														: undefined;
											return (
												<EnvEditableCell
													placeholder="Value"
													value={h.value}
													onChange={(val) => update("value", val)}
													variables={activeEnvVariables}
													list={valueListId}
												/>
											);
										}}
									/>
								</div>
							)}
						</>
					)}

					{showEditor && tab === "docs" && (
						<>
							<PaneHeader title="API documentation" tag="Markdown" />
							<div className="docs-area">
								{doc?.docs ? (
									<ReactMarkdown>{doc.docs}</ReactMarkdown>
								) : (
									<p className="muted">No documentation</p>
								)}
							</div>
						</>
					)}

					{showEditor && tab === "pre-script" && (
						<>
							<PaneHeader title="Pre-request script" tag="TS/JS">
								{doc?.pre?.source !== undefined && (
									<Button
										disabled={deleteScriptMutation.isPending}
										onClick={() => setDeleteConfirm("pre")}
										title="Delete Script"
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive/90"
									>
										<Delete02Icon size={18} />
									</Button>
								)}
							</PaneHeader>
							<div className="px-4 py-2 bg-[var(--highlight-bg,#fffbe6)] border-b text-[0.9em] text-foreground">
								ℹ️ <strong>Read-only mode:</strong> Scripts cannot be edited here
								currently. Please edit the script file directly in your code
								editor.
							</div>
							{doc?.pre?.source !== undefined ? (
								<div className="flex flex-col h-full">
									<div className="flex-1 border border-border border-t-0 overflow-auto">
										<CodeEditor
											value={draftPreScript}
											onChange={setDraftPreScript}
											language="javascript"
											variables={activeEnvVariables}
											style={{ height: "100%" }}
											readOnly={true}
										/>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center p-6 text-center">
									<p className="text-muted-foreground">
										No pre-request script exists for this request.
									</p>
									<Button
										className="mt-4"
										disabled={createScriptMutation.isPending}
										onClick={() => {
											createScriptMutation.mutate({ type: "pre" });
										}}
									>
										Create Script
									</Button>
								</div>
							)}
						</>
					)}

					{showEditor && tab === "post-script" && (
						<>
							<PaneHeader title="Post-response script" tag="TS/JS">
								{doc?.post?.source !== undefined && (
									<Button
										disabled={deleteScriptMutation.isPending}
										onClick={() => setDeleteConfirm("post")}
										title="Delete Script"
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive/90"
									>
										<Delete02Icon size={18} />
									</Button>
								)}
							</PaneHeader>
							<div className="px-4 py-2 bg-[var(--highlight-bg,#fffbe6)] border-b text-[0.9em] text-foreground">
								ℹ️ <strong>Read-only mode:</strong> Scripts cannot be edited here
								currently. Please edit the script file directly in your code
								editor.
							</div>
							{doc?.post?.source !== undefined ? (
								<div className="flex flex-col h-full">
									<div className="flex-1 border border-border border-t-0 overflow-auto">
										<CodeEditor
											value={draftPostScript}
											onChange={setDraftPostScript}
											language="javascript"
											variables={activeEnvVariables}
											style={{ height: "100%" }}
											readOnly={true}
										/>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center p-6 text-center">
									<p className="text-muted-foreground">
										No post-response script exists for this request.
									</p>
									<Button
										className="mt-4"
										disabled={createScriptMutation.isPending}
										onClick={() => {
											createScriptMutation.mutate({ type: "post" });
										}}
									>
										Create Script
									</Button>
								</div>
							)}
						</>
					)}

					{showEditor && tab === "examples" && doc && (
						<>
							<PaneHeader title="Examples" tag="yaml" />
							<pre className="code-editor mono">{formatExamples(doc)}</pre>
						</>
					)}
				</div>

				{children}
			</div>

			{/* Datalists for autocompletion */}
			<datalist id="common-headers">
				{COMMON_HEADERS.map((h) => (
					<option key={h} value={h} />
				))}
			</datalist>
			<datalist id="content-types">
				{COMMON_CONTENT_TYPES.map((t) => (
					<option key={t} value={t} />
				))}
			</datalist>
			<datalist id="accept-types">
				{COMMON_ACCEPTS.map((t) => (
					<option key={t} value={t} />
				))}
			</datalist>

			{deleteConfirm && (
				<ConfirmDialog
					title="Delete Script?"
					message={
						<p style={{ margin: 0 }}>
							Are you sure you want to delete this{" "}
							{deleteConfirm === "pre" ? "pre-request" : "post-response"}{" "}
							script?
						</p>
					}
					confirmText="Delete"
					isDestructive={true}
					onCancel={() => setDeleteConfirm(null)}
					onConfirm={() => {
						deleteScriptMutation.mutate({ type: deleteConfirm });
						setDeleteConfirm(null);
					}}
				/>
			)}
		</>
	);
}
