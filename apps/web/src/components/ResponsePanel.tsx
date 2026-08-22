import { PackageIcon, ZapIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import type { SendResponse } from "../api/types.js";
import { formatBytes } from "../utils/method.js";
import { Tabs } from "./Tabs.js";

type ResponsePanelProps = {
	result: SendResponse | null;
	error: string | null;
	loading: boolean;
	collapsed: boolean;
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

const MIN_WIDTH = 400;
const MAX_WIDTH = 800;

export function ResponsePanel({
	result,
	error,
	loading,
	collapsed,
}: ResponsePanelProps) {
	const [tab, setTab] = useState<ResponseTab>("body");
	const [width, setWidth] = useState(340);
	const [resizing, setResizing] = useState(false);
	const draggingRef = useRef(false);

	if (collapsed) return null;

	const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
		draggingRef.current = true;
		setResizing(true);
		e.currentTarget.setPointerCapture(e.pointerId);
		document.body.style.userSelect = "none";
		document.body.style.cursor = "col-resize";
	};

	const onResize = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!draggingRef.current) return;
		const pane = e.currentTarget.parentElement;
		if (!pane) return;
		const next = pane.getBoundingClientRect().right - e.clientX;
		setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
	};

	const endResize = (e: React.PointerEvent<HTMLDivElement>) => {
		draggingRef.current = false;
		setResizing(false);
		document.body.style.userSelect = "";
		document.body.style.cursor = "";
		e.currentTarget.releasePointerCapture(e.pointerId);
	};

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
		<div className="response-pane" style={{ width }}>
			<div
				className={`resize-handle${resizing ? " active" : ""}`}
				onPointerDown={startResize}
				onPointerMove={onResize}
				onPointerUp={endResize}
				title="Drag to resize"
			/>
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
							<span className="resolved-url mono" title={result.resolved.url}>
								{result.resolved.method} {result.resolved.url}
							</span>
							<span className="meta-item">
								<HugeiconsIcon icon={ZapIcon} size={14} />{" "}
								{result.response.durationMs}ms
							</span>
							<span className="meta-item">
								<HugeiconsIcon icon={PackageIcon} size={14} />{" "}
								{formatBytes(result.response.body)}
							</span>
						</>
					)}
				</div>
			</div>
			<Tabs
				className="response-tabs"
				tabs={[
					{ id: "body", label: "Body" },
					{ id: "headers", label: "Headers" },
				]}
				activeTab={tab}
				onChange={setTab as (id: string) => void}
			/>

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
