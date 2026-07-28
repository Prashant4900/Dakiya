import { type ReactNode, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { RequestDocument, RequestResponse } from "../api/types.js";
import { methodBadgeClass, methodColorVar } from "../utils/method.js";
import { formatExamples } from "./EnvSwitcher.js";

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
	onSave: (source: string) => Promise<void>;
	onSend: () => void;
	sending: boolean;
	saving: boolean;
	children?: ReactNode;
};

export function RequestPanel({
	request,
	loading,
	error,
	onSave,
	onSend,
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

	if (loading) {
		return (
			<div className="main-empty">
				<p className="muted">Loading…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="main-empty">
				<p className="error-text">{error}</p>
			</div>
		);
	}

	if (!request) {
		return (
			<div className="main-empty">
				<p className="muted">Select a request from the sidebar</p>
			</div>
		);
	}

	const doc: RequestDocument = request.document;
	const method = doc.request.method;

	const handleSave = async () => {
		await onSave(draft);
		setDirty(false);
	};

	const tabs: { id: EditorTab; label: string; badge?: number }[] = [
		{ id: "body", label: "Body" },
		{
			id: "headers",
			label: "Headers",
			badge: Object.keys(doc.request.headers).length || undefined,
		},
		{ id: "docs", label: "Docs" },
		{ id: "pre-script", label: "Pre-script" },
		{ id: "post-script", label: "Post-script" },
	];

	if (doc.examples?.length) {
		tabs.push({
			id: "examples",
			label: "Examples",
			badge: doc.examples.length,
		});
	}

	return (
		<>
			<div className="request-bar">
				<span
					className={`method-select mono ${methodBadgeClass(method)}`}
					style={{ color: methodColorVar(method) }}
				>
					{method}
				</span>
				<div className="url-input mono" title={doc.request.url}>
					{doc.request.url}
				</div>
				<button
					type="button"
					className="pane-action-btn"
					onClick={handleSave}
					disabled={!dirty || saving}
				>
					{saving ? "Saving…" : "Save"}
				</button>
				<button
					type="button"
					className="send-button"
					onClick={onSend}
					disabled={sending || dirty}
					title={dirty ? "Save before sending" : undefined}
				>
					{sending ? "Sending…" : "Send"}
				</button>
			</div>

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

			<div className="content-split">
				<div className="request-pane">
					{tab === "body" && (
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

					{tab === "headers" && (
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
										{Object.entries(doc.request.headers).length === 0 ? (
											<tr>
												<td colSpan={2} className="muted">
													No headers
												</td>
											</tr>
										) : (
											Object.entries(doc.request.headers).map(([k, v]) => (
												<tr key={k}>
													<td className="kv-key">{k}</td>
													<td className="kv-val">{v}</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</>
					)}

					{tab === "docs" && (
						<>
							<div className="pane-header">
								<span className="pane-title">API documentation</span>
								<span className="pane-tag">Markdown</span>
							</div>
							<div className="docs-area">
								{doc.docs ? (
									<ReactMarkdown>{doc.docs}</ReactMarkdown>
								) : (
									<p className="muted">No documentation</p>
								)}
							</div>
						</>
					)}

					{tab === "pre-script" && (
						<>
							<div className="pane-header">
								<span className="pane-title">Pre-request script</span>
								<span className="pane-tag">{doc.pre?.lang ?? "JS"}</span>
							</div>
							<pre className="code-editor mono">
								{doc.pre?.source ?? "// No pre-script"}
							</pre>
						</>
					)}

					{tab === "post-script" && (
						<>
							<div className="pane-header">
								<span className="pane-title">Post-response script</span>
								<span className="pane-tag">{doc.post?.lang ?? "JS"}</span>
							</div>
							<pre className="code-editor mono">
								{doc.post?.source ?? "// No post-script"}
							</pre>
						</>
					)}

					{tab === "examples" && (
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
