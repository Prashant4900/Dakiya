import { type ReactNode, useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import type { RequestDocument, RequestResponse } from "../api/types.js";
import { formatExamples } from "../utils/format.js";
import { methodBadgeClass, methodColorVar } from "../utils/method.js";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

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
	"X-Forwarded-Proto"
];

const COMMON_CONTENT_TYPES = [
	"application/json",
	"application/x-www-form-urlencoded",
	"multipart/form-data",
	"text/html",
	"text/plain",
	"application/xml",
];

const COMMON_ACCEPTS = [
	"application/json",
	"text/html",
	"*/*",
];

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
	onSave: (source: string) => Promise<void>;
	onSend: () => void;
	onDirtyChange: (dirty: boolean) => void;
	sending: boolean;
	saving: boolean;
	activeEnvVariables: Record<string, string>;
	children?: ReactNode;
};

// Component for a single variable token with popover
function EnvVarToken({ varName, val }: { varName: string; val: string | undefined }) {
	const [rect, setRect] = useState<DOMRect | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const timeoutRef = useRef<number | null>(null);

	const handleMouseEnter = (e: React.MouseEvent) => {
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
			<span
				className={`env-var-highlight ${isResolved ? "" : "unresolved"}`}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				{`{{${varName}}}`}
			</span>
			{isHovered && rect && createPortal(
				<div
					className="env-var-popover"
					style={{
						top: rect.bottom + 6,
						left: Math.min(rect.left, window.innerWidth - 340),
					}}
					onMouseEnter={handlePopoverEnter}
					onMouseLeave={handleMouseLeave}
				>
					<div className="env-var-popover-value">
						<input readOnly value={isResolved ? val : "Unresolved Variable"} className={!isResolved ? 'unresolved-input' : ''} />
					</div>
					<div className="env-var-popover-footer">
						<div className="env-var-popover-scope">
							<span className="env-var-popover-scope-icon">E</span> Environment
						</div>
					</div>
				</div>,
				document.body
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
					return <EnvVarToken key={i} varName={varName} val={val} />;
				}
				return <span key={i}>{part}</span>;
			})}
		</>
	);
}

// Editable Cell component that shows EnvHighlight when not focused
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

	return (
		<div
			className="kv-editable-cell"
			onClick={() => setIsFocused(true)}
			onBlur={(e) => {
				// Don't blur if we're clicking inside the same cell
				if (!e.currentTarget.contains(e.relatedTarget)) {
					setIsFocused(false);
				}
			}}
		>
			{isFocused || !value ? (
				<input
					type="text"
					className="kv-input"
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					autoFocus={isFocused}
					list={list}
				/>
			) : (
				<div className="kv-cell-preview">
					<EnvHighlight text={value} variables={variables} />
				</div>
			)}
		</div>
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
	const [tab, setTab] = useState<EditorTab>("body");
	const [draft, setDraft] = useState("");
	const [dirty, setDirty] = useState(false);
	const [localHeaders, setLocalHeaders] = useState<{ id: number; key: string; value: string }[]>([]);
	const [parseError, setParseError] = useState<string | null>(null);

	useEffect(() => {
		if (request) {
			setDraft(request.source);
			setDirty(false);
			setTab("body");
		}
	}, [request]);

	useEffect(() => {
		onDirtyChange(dirty);
	}, [dirty, onDirtyChange]);

	let doc: RequestDocument | undefined = request?.document;

	const method = doc?.request.method ?? "GET";
	const url = doc?.request.url ?? "";

	// Sync headers to local state when entering headers tab
	useEffect(() => {
		if (tab === "headers" && doc) {
			const h = Object.entries(doc.request.headers || {}).map(([k, v], i) => ({
				id: i,
				key: k,
				value: String(v),
			}));
			setLocalHeaders(h);
			setParseError(null);
		}
	}, [tab, request]);

	// Note: We included `draft` in dependencies above so if the user clicks "Save" and request reloads,
	// or if the draft changes externally, headers reload. But wait, if they type in the table, it modifies draft!
	// This would cause a re-render loop or focus loss. Let's fix this by only updating if not editing.
	// Actually, it's safer to only sync when tab changes or request changes.

	// Let's refactor the useEffect to only run when tab changes or request ID changes.

	const handleSave = async () => {
		await onSave(draft);
		setDirty(false);
	};

	const handleSend = useCallback(async () => {
		if (dirty) {
			await onSave(draft);
			setDirty(false);
		}
		onSend();
	}, [dirty, draft, onSave, onSend]);

	const updateDraftHeaders = () => {
		// Editing not supported with YAML multi-file format yet
	};

	const handleHeaderChange = (index: number, field: "key" | "value", val: string) => {
		const newHeaders = [...localHeaders];
		newHeaders[index][field] = val;

		// Add empty row if last row was modified
		if (index === newHeaders.length - 1 && (newHeaders[index].key || newHeaders[index].value)) {
			newHeaders.push({ id: Date.now(), key: "", value: "" });
		}

		setLocalHeaders(newHeaders);
		updateDraftHeaders();
	};

	const handleHeaderRemove = (index: number) => {
		let newHeaders = localHeaders.filter((_, i) => i !== index);
		if (newHeaders.length === 0 || (newHeaders[newHeaders.length - 1].key || newHeaders[newHeaders.length - 1].value)) {
			newHeaders.push({ id: Date.now(), key: "", value: "" });
		}
		setLocalHeaders(newHeaders);
		updateDraftHeaders();
	};

	// We fix the syncing issue by using a ref to track if we are actively editing headers.
	const isEditingHeaders = useRef(false);
	useEffect(() => {
		if (tab === "headers" && !isEditingHeaders.current && doc) {
			const h = Object.entries(doc.request.headers || {}).map(([k, v], i) => ({
				id: i,
				key: k,
				value: String(v),
			}));
			setLocalHeaders(h);
			setParseError(null);
		}
	}, [tab, request]);

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
					{url ? <EnvHighlight text={url} variables={activeEnvVariables} /> : "Select a request"}
				</div>
				<button
					type="button"
					className="send-button"
					onClick={() => void handleSend()}
					disabled={sending || saving || !request || loading}
					title="Send (⌘↵)"
				>
					{sending ? "Sending…" : "Send"}
				</button>
				<button
					type="button"
					className="save-button"
					onClick={handleSave}
					disabled={!dirty || saving || !request}
				>
					{saving ? "Saving…" : "Save"}
				</button>
			</div>

			{(saveError || error) && (
				<div className="request-errors">
					{saveError && <p className="error-text">{saveError}</p>}
					{error && !loading && <p className="error-text">{error}</p>}
				</div>
			)}

			{showEditor && (
				<div className="request-tabs">
					{tabs.map((t) => (
						<button
							key={t.id}
							type="button"
							className={`tab-item${tab === t.id ? " active" : ""}`}
							onClick={() => setTab(t.id)}
						>
							{t.label}
							{t.badge !== undefined && t.badge > 0 && (
								<span className="tab-badge">{t.badge}</span>
							)}
						</button>
					))}
					{dirty && <span className="dirty-hint">unsaved</span>}
				</div>
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
						<>
							<div className="pane-header">
								<span className="pane-title">Request source</span>
								<span className="pane-tag">.drq</span>
							</div>
							<textarea
								className="code-editor mono"
								value="Editing request body is not supported with the YAML multi-file structure yet. Please edit the requests.yaml file directly."
								onChange={() => {}}
								spellCheck={false}
								disabled
							/>
						</>
					)}

					{showEditor && tab === "headers" && (
						<>
							<div className="pane-header">
								<span className="pane-title">Request headers</span>
								<span className="pane-tag">KV</span>
							</div>

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
											onFocus={() => { isEditingHeaders.current = true; }}
											onBlur={(e) => {
												// if focus completely leaves the tbody
												if (!e.currentTarget.contains(e.relatedTarget)) {
													isEditingHeaders.current = false;
												}
											}}
										>
											{localHeaders.map((h, i) => {
												const keyLower = h.key.toLowerCase();
												const valueListId = keyLower === "content-type" 
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
															onChange={(val) => handleHeaderChange(i, "key", val)}
															variables={activeEnvVariables}
															list="common-headers"
														/>
													</td>
													<td className="kv-val">
														<EnvEditableCell
															placeholder="Value"
															value={h.value}
															onChange={(val) => handleHeaderChange(i, "value", val)}
															variables={activeEnvVariables}
															list={valueListId}
														/>
													</td>
													<td className="kv-actions">
														{i !== localHeaders.length - 1 && (
															<button
																type="button"
																className="kv-remove-btn"
																onClick={() => handleHeaderRemove(i)}
																title="Remove header"
															>
																<HugeiconsIcon icon={Cancel01Icon} size={14} />
															</button>
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
							<div className="pane-header">
								<span className="pane-title">API documentation</span>
								<span className="pane-tag">Markdown</span>
							</div>
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
							<div className="pane-header">
								<span className="pane-title">Pre-request script</span>
								<span className="pane-tag">{doc?.pre?.lang ?? "JS"}</span>
							</div>
							<pre className="code-editor mono">
								{doc?.pre?.source ?? "// No pre-script"}
							</pre>
						</>
					)}

					{showEditor && tab === "post-script" && (
						<>
							<div className="pane-header">
								<span className="pane-title">Post-response script</span>
								<span className="pane-tag">{doc?.post?.lang ?? "JS"}</span>
							</div>
							<pre className="code-editor mono">
								{doc?.post?.source ?? "// No post-script"}
							</pre>
						</>
					)}

					{showEditor && tab === "examples" && doc && (
						<>
							<div className="pane-header">
								<span className="pane-title">Examples</span>
								<span className="pane-tag">.drq</span>
							</div>
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
		</>
	);
}
