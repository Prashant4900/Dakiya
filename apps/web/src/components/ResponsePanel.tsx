import { useState } from "react";
import type { SendResponse } from "../api/types.js";
import { formatBytes } from "../utils/method.js";

type ResponsePanelProps = {
	result: SendResponse | null;
	error: string | null;
	loading: boolean;
};

type ResponseTab = "body" | "headers";

function formatBody(body: string, contentType?: string): string {
	if (!body) return "(empty)";
	if (contentType?.includes("application/json")) {
		try {
			return JSON.stringify(JSON.parse(body), null, 2);
		} catch {
			return body;
		}
	}
	return body;
}

export function ResponsePanel({ result, error, loading }: ResponsePanelProps) {
	const [tab, setTab] = useState<ResponseTab>("body");

	const statusClass = !result
		? "pending"
		: result.response.status >= 400
			? "error"
			: "ok";

	const headersText =
		result && Object.entries(result.response.headers).length > 0
			? Object.entries(result.response.headers)
					.map(([k, v]) => `${k}: ${v}`)
					.join("\n")
			: "(none)";

	return (
		<div className="response-pane">
			<div className="response-status">
				{loading && <span className="status-pill pending">—</span>}
				{error && !loading && <span className="status-pill error">Error</span>}
				{result && !loading && (
					<span className={`status-pill ${statusClass}`}>
						{result.response.status} {result.response.statusText}
					</span>
				)}
				{!result && !loading && !error && (
					<span className="status-pill pending">—</span>
				)}
				<div className="resp-meta">
					{result && (
						<>
							<span>⚡ {result.response.durationMs}ms</span>
							<span>📦 {formatBytes(result.response.body)}</span>
						</>
					)}
				</div>
			</div>

			<div className="response-tabs">
				<button
					type="button"
					className={`tab-item${tab === "body" ? " active" : ""}`}
					onClick={() => setTab("body")}
				>
					Body
				</button>
				<button
					type="button"
					className={`tab-item${tab === "headers" ? " active" : ""}`}
					onClick={() => setTab("headers")}
				>
					Headers
				</button>
			</div>

			<div className="pane-header">
				<span className="pane-title">
					{tab === "body" ? "Response body" : "Response headers"}
				</span>
				<span className="pane-tag">
					{result?.response.headers["content-type"]?.includes("json")
						? "JSON"
						: "Text"}
				</span>
			</div>

			{error && !loading && (
				<pre className="code-editor mono error-text">{error}</pre>
			)}

			{!result && !loading && !error && (
				<p className="pane-empty muted">Click Send to get a response</p>
			)}

			{result && !error && tab === "body" && (
				<pre className="code-editor mono">
					{formatBody(
						result.response.body,
						result.response.headers["content-type"],
					)}
				</pre>
			)}

			{result && !error && tab === "headers" && (
				<pre className="code-editor mono">{headersText}</pre>
			)}

			{result && result.logs.length > 0 && (
				<div className="script-logs">
					<p className="section-label">Console</p>
					<pre className="mono">{result.logs.join("\n")}</pre>
				</div>
			)}
		</div>
	);
}
