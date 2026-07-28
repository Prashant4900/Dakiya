import { type ReactNode, useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { RequestDocument, RequestResponse } from "../api/types.js";
import { formatExamples } from "../utils/format.js";
import { methodBadgeClass, methodColorVar } from "../utils/method.js";

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
	children?: ReactNode;
};

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
	children,
}: RequestPanelProps) {
	const [tab, setTab] = useState<EditorTab>("body");
	const [draft, setDraft] = useState("");
	const [dirty, setDirty] = useState(false);

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

	const doc: RequestDocument | undefined = request?.document;
	const method = doc?.request.method ?? "GET";
	const url = doc?.request.url ?? "";

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
				<div className="url-input mono" title={url || "No URL"}>
					{url || "Select a request"}
				</div>
				<button
					type="button"
					className="pane-action-btn"
					onClick={handleSave}
					disabled={!dirty || saving || !request}
				>
					{saving ? "Saving…" : "Save"}
				</button>
				<button
					type="button"
					className="send-button"
					onClick={() => void handleSend()}
					disabled={sending || saving || !request || loading}
					title="Send (⌘↵)"
				>
					{sending ? "Sending…" : "Send"}
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
								value={draft}
								onChange={(e) => {
									setDraft(e.target.value);
									setDirty(true);
								}}
								spellCheck={false}
							/>
						</>
					)}

					{showEditor && tab === "headers" && (
						<>
							<div className="pane-header">
								<span className="pane-title">Request headers</span>
								<span className="pane-tag">KV</span>
							</div>
							<div className="code-editor code-editor-table">
								<table className="kv-table">
									<thead>
										<tr>
											<th>Key</th>
											<th>Value</th>
										</tr>
									</thead>
									<tbody>
										{Object.entries(doc?.request.headers ?? {}).length === 0 ? (
											<tr>
												<td colSpan={2} className="muted">
													No headers
												</td>
											</tr>
										) : (
											Object.entries(doc?.request.headers ?? {}).map(
												([k, v]) => (
													<tr key={k}>
														<td className="kv-key">{k}</td>
														<td className="kv-val">{v}</td>
													</tr>
												),
											)
										)}
									</tbody>
								</table>
							</div>
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
		</>
	);
}
