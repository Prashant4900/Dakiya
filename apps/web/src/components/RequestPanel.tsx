import type { RequestBody } from "@dakiya/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { deleteScript, saveScript } from "../api/client.js";
import type { RequestDocument, RequestResponse } from "../api/types.js";
import { formatExamples } from "../utils/format.js";
import { methodBadgeClass, methodColorVar } from "../utils/method.js";
import { BodyEditor } from "./BodyEditor.js";
import { Button } from "./Button.js";
import { CodeEditor } from "./CodeEditor.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { Cancel01Icon } from "./icons/Cancel01Icon.js";
import { Delete02Icon } from "./icons/Delete02Icon.js";
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
	saveError: string | null;
	onSave: (updates: Record<string, unknown>) => Promise<void>;
	onSend: () => void;
	onDirtyChange: (dirty: boolean) => void;
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
				className={`env-var-highlight ${isResolved ? "" : "unresolved"}`}
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
						className="env-var-popover"
						style={{
							top: rect.bottom + 6,
							left: Math.min(rect.left, window.innerWidth - 340),
						}}
						onMouseEnter={handlePopoverEnter}
						onMouseLeave={handleMouseLeave}
						onFocus={handlePopoverEnter}
						onBlur={handleMouseLeave}
					>
						<div className="env-var-popover-value">
							<input
								readOnly
								value={isResolved ? val : "Unresolved Variable"}
								className={!isResolved ? "unresolved-input" : ""}
							/>
						</div>
						<div className="env-var-popover-footer">
							<div className="env-var-popover-scope">
								<span className="env-var-popover-scope-icon">E</span>{" "}
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
	if (!text) return null;

	const parts = text.split(/(\{\{[^}]+\}\})/g);
	return (
		<>
			{parts.map((part, i) => {
				if (part.startsWith("{{") && part.endsWith("}}")) {
					const varName = part.slice(2, -2).trim();
					const val = variables[varName];
					// biome-ignore lint/suspicious/noArrayIndexKey: parts are static
					return <EnvVarToken key={varName + i} varName={varName} val={val} />;
				}
				// biome-ignore lint/suspicious/noArrayIndexKey: parts are static
				return <span key={part + i}>{part}</span>;
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
	saveError,
	onSave,
	onSend,
	onDirtyChange,
	sending,
	saving,
	activeEnvVariables,
	children,
}: RequestPanelProps) {
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
	const [localHeaders, setLocalHeaders] = useState<
		{ id: number; key: string; value: string }[]
	>([]);
	const [parseError, setParseError] = useState<string | null>(null);

	const queryClient = useQueryClient();
	const [draftPreScript, setDraftPreScript] = useState("");
	const [draftPostScript, setDraftPostScript] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState<"pre" | "post" | null>(
		null,
	);

	const saveScriptMutation = useMutation({
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
			setDirty(false);
		}
	}, [request]);

	useEffect(() => {
		onDirtyChange(dirty);
	}, [dirty, onDirtyChange]);

	const doc: RequestDocument | undefined = request?.document;

	const method = doc?.request.method ?? "GET";
	const url = doc?.request.url ?? "";
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
		await onSave({ body: localBody, headers: headersObj });
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
			await onSave({ body: localBody, headers: headersObj });
			setDirty(false);
		}
		onSend();
	}, [dirty, localBody, localHeaders, onSave, onSend]);

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
						id: Date.now(),
						key: "Content-Type",
						value: autoContentType,
					});
					newHeaders.push({ id: Date.now() + 1, key: "", value: "" }); // Add trailing empty row
					return newHeaders;
				}
				return prev;
			});
		}
	};

	const updateDraftHeaders = () => {
		setDirty(true);
	};

	const handleHeaderChange = (
		index: number,
		field: "key" | "value",
		val: string,
	) => {
		const newHeaders = [...localHeaders];
		newHeaders[index][field] = val;

		// Add empty row if last row was modified
		if (
			index === newHeaders.length - 1 &&
			(newHeaders[index].key || newHeaders[index].value)
		) {
			newHeaders.push({ id: Date.now(), key: "", value: "" });
		}

		setLocalHeaders(newHeaders);
		updateDraftHeaders();
	};

	const handleHeaderRemove = (index: number) => {
		const newHeaders = localHeaders.filter((_, i) => i !== index);
		if (
			newHeaders.length === 0 ||
			newHeaders[newHeaders.length - 1].key ||
			newHeaders[newHeaders.length - 1].value
		) {
			newHeaders.push({ id: Date.now(), key: "", value: "" });
		}
		setLocalHeaders(newHeaders);
		updateDraftHeaders();
	};

	const isEditingHeaders = useRef(false);
	useEffect(() => {
		if (tab === "headers" && !isEditingHeaders.current && doc) {
			const h = Object.entries(doc.request.headers || {}).map(([k, v], i) => ({
				id: i,
				key: k,
				value: String(v),
			}));
			// ALWAYS add a trailing empty row so users can start typing new headers
			h.push({ id: Date.now(), key: "", value: "" });
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
			<div className="request-bar">
				<span
					className={`method-select mono ${methodBadgeClass(method)}`}
					style={{ color: methodColorVar(method) }}
				>
					{method}
				</span>
				<div className="url-input mono">
					{url ? (
						<EnvHighlight text={url} variables={activeEnvVariables} />
					) : (
						"Select a request"
					)}
				</div>
				<Button
					variant="primary"
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
				<div className="request-errors">
					{saveError && <p className="error-text">{saveError}</p>}
					{error && !loading && <p className="error-text">{error}</p>}
				</div>
			)}

			{showEditor && (
				<Tabs
					tabs={tabs}
					activeTab={tab}
					onChange={setTab as (id: string) => void}
				>
					{dirty && <span className="dirty-hint">unsaved</span>}
				</Tabs>
			)}

			<div className="content-split">
				<div className="request-pane">
					{loading && <div className="pane-empty muted">Loading request…</div>}

					{!request && !loading && (
						<div className="pane-empty muted">
							Select a request from the sidebar
						</div>
					)}

					{error && !loading && request === null && (
						<div className="pane-empty error-text">{error}</div>
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
								<div className="pane-empty error-text">{parseError}</div>
							) : (
								<div className="code-editor code-editor-table">
									<table className="kv-table editable-kv-table">
										<thead>
											<tr>
												<th>Key</th>
												<th>Value</th>
												<th className="kv-actions"></th>
											</tr>
										</thead>
										<tbody
											onFocus={() => {
												isEditingHeaders.current = true;
											}}
											onBlur={(e) => {
												// if focus completely leaves the tbody
												if (!e.currentTarget.contains(e.relatedTarget)) {
													isEditingHeaders.current = false;
												}
											}}
										>
											{localHeaders.map((h, i) => {
												const keyLower = h.key.toLowerCase();
												const valueListId =
													keyLower === "content-type"
														? "content-types"
														: keyLower === "accept"
															? "accept-types"
															: undefined;

												return (
													<tr key={h.id}>
														<td className="kv-key">
															<EnvEditableCell
																placeholder="Header"
																value={h.key}
																onChange={(val) =>
																	handleHeaderChange(i, "key", val)
																}
																variables={activeEnvVariables}
																list="common-headers"
															/>
														</td>
														<td className="kv-val">
															<EnvEditableCell
																placeholder="Value"
																value={h.value}
																onChange={(val) =>
																	handleHeaderChange(i, "value", val)
																}
																variables={activeEnvVariables}
																list={valueListId}
															/>
														</td>
														<td className="kv-actions">
															{i !== localHeaders.length - 1 && (
																<Button
																	className="kv-remove-btn"
																	onClick={() => handleHeaderRemove(i)}
																	title="Remove header"
																	icon={<Cancel01Icon size={14} />}
																	variant="icon"
																/>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
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
										icon={<Delete02Icon size={18} />}
										variant="icon"
										style={{ color: "var(--danger-text, #d03030)" }}
									/>
								)}
							</PaneHeader>
							<div
								style={{
									padding: "8px 16px",
									background: "var(--highlight-bg, #fffbe6)",
									borderBottom: "1px solid var(--border-color)",
									fontSize: "0.9em",
									color: "var(--text-color)",
								}}
							>
								ℹ️ <strong>Read-only mode:</strong> Scripts cannot be edited here
								currently. Please edit the script file directly in your code
								editor.
							</div>
							{doc?.pre?.source !== undefined ? (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										height: "100%",
									}}
								>
									<div
										style={{
											flex: 1,
											border: "1px solid var(--border-color)",
											borderTop: "none",
											overflow: "auto",
										}}
									>
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
								<div
									className="empty-state"
									style={{ padding: "24px", textAlign: "center" }}
								>
									<p className="muted">
										No pre-request script exists for this request.
									</p>
									<Button
										variant="primary"
										style={{ marginTop: "16px" }}
										onClick={() => {
											setDraftPreScript(
												"// Enter your pre-request script here\n",
											);
											saveScriptMutation.mutate({
												type: "pre",
												source: "// Enter your pre-request script here\n",
											});
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
										icon={<Delete02Icon size={18} />}
										variant="icon"
										style={{ color: "var(--danger-text, #d03030)" }}
									/>
								)}
							</PaneHeader>
							<div
								style={{
									padding: "8px 16px",
									background: "var(--highlight-bg, #fffbe6)",
									borderBottom: "1px solid var(--border-color)",
									fontSize: "0.9em",
									color: "var(--text-color)",
								}}
							>
								ℹ️ <strong>Read-only mode:</strong> Scripts cannot be edited here
								currently. Please edit the script file directly in your code
								editor.
							</div>
							{doc?.post?.source !== undefined ? (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										height: "100%",
									}}
								>
									<div
										style={{
											flex: 1,
											border: "1px solid var(--border-color)",
											borderTop: "none",
											overflow: "auto",
										}}
									>
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
								<div
									className="empty-state"
									style={{ padding: "24px", textAlign: "center" }}
								>
									<p className="muted">
										No post-response script exists for this request.
									</p>
									<Button
										variant="primary"
										style={{ marginTop: "16px" }}
										onClick={() => {
											setDraftPostScript(
												"// Enter your post-response script here\n",
											);
											saveScriptMutation.mutate({
												type: "post",
												source: "// Enter your post-response script here\n",
											});
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
							<PaneHeader title="Examples" tag=".drq" />
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
