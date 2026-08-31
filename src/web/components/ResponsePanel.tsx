import { Copy01Icon, PackageIcon, ZapIcon } from "hugeicons-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SendResponse } from "../api/types.js";
import { formatBytes } from "../utils/method.js";
import { CodeEditor } from "./CodeEditor.js";
import { PaneHeader } from "./PaneHeader.js";
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

function escapeShell(str: string): string {
	return `'${str.replace(/'/g, "'\\''")}'`;
}

function buildCurl(resolved: SendResponse["resolved"]): string {
	let curl = `curl -X ${resolved.method} '${resolved.url}'`;
	for (const [key, value] of Object.entries(resolved.headers)) {
		curl += ` \\\n  -H ${escapeShell(`${key}: ${value}`)}`;
	}
	if (resolved.body) {
		curl += ` \\\n  -d ${escapeShell(resolved.body)}`;
	}
	return curl;
}

const MIN_WIDTH = 500;
const MAX_WIDTH = 800;

export function ResponsePanel({
	result,
	error,
	loading,
	collapsed,
}: ResponsePanelProps) {
	const [tab, setTab] = useState<ResponseTab>("body");
	const [copied, setCopied] = useState(false);
	const [copiedCurl, setCopiedCurl] = useState(false);
	const [width, setWidth] = useState(500);
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
								<ZapIcon size={14} /> {result.response.durationMs}ms
							</span>
							<span className="meta-item">
								<PackageIcon size={14} /> {formatBytes(result.response.body)}
							</span>
							<Button
								variant="secondary"
								size="sm"
								onClick={async () => {
									try {
										await navigator.clipboard.writeText(
											buildCurl(result.resolved),
										);
										setCopiedCurl(true);
										setTimeout(() => setCopiedCurl(false), 2000);
									} catch (e) {
										console.error("Failed to copy cURL", e);
									}
								}}
								title="Copy as cURL"
								className="ml-auto h-6 text-[11px] gap-1 px-2"
							>
								<Copy01Icon size={12} />
								{copiedCurl ? "Copied!" : "cURL"}
							</Button>
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

			<PaneHeader
				title={tab === "body" ? "Response body" : "Response headers"}
				tag={
					result?.response.headers["content-type"]?.includes("json")
						? "JSON"
						: "Text"
				}
			/>

			{error && !loading && (
				<pre className="code-editor mono error-text">{error}</pre>
			)}

			{!result && !loading && !error && (
				<p className="pane-empty muted">Click Send to get a response</p>
			)}

			{result && !error && tab === "body" && (
				<div
					style={{
						position: "relative",
						flex: 1,
						overflow: "auto",
						border: "1px solid var(--border-color)",
						borderTop: "none",
					}}
				>
					<CodeEditor
						value={formatBody(
							result.response.body,
							result.response.headers["content-type"],
						)}
						language={
							result.response.headers["content-type"]?.includes("json")
								? "json"
								: "javascript"
						}
						readOnly={true}
						style={{ height: "100%" }}
					/>
					<Button
						onClick={async () => {
							if (!result?.response.body) return;
							const text = formatBody(
								result.response.body,
								result.response.headers["content-type"],
							);
							try {
								await navigator.clipboard.writeText(text);
								setCopied(true);
								setTimeout(() => setCopied(false), 2000);
							} catch (e) {
								console.error("Failed to copy", e);
							}
						}}
						variant="secondary"
						size="sm"
						className="absolute top-2 right-4 z-10 h-7 text-xs gap-1.5"
					>
						<Copy01Icon size={14} />
						{copied ? "Copied!" : "Copy"}
					</Button>
				</div>
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
