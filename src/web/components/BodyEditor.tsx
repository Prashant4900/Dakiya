import type { RequestBody } from "@core/domain";
import { Cancel01Icon } from "hugeicons-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { uploadFile } from "../api/client.js";
import { CodeEditor } from "./CodeEditor.js";
import { KeyValueEditor } from "./KeyValueEditor.js";
import { PaneHeader } from "./PaneHeader.js";

type BodyEditorProps = {
	body: RequestBody | undefined;
	onChange: (body: RequestBody | undefined) => void;
	variables?: Record<string, string>;
};

export function BodyEditor({ body, onChange, variables }: BodyEditorProps) {
	const [mode, setMode] = useState<any>(
		(typeof body === "object" && body?.type) || "none",
	);

	useEffect(() => {
		const currentType = typeof body === "object" ? body.type : "none";
		if (currentType && currentType !== mode && currentType !== "none") {
			setMode(currentType);
		} else if (!body && mode !== "none") {
			setMode("none");
		}
	}, [body, mode]);

	const handleModeChange = (
		newMode: "none" | "raw" | "form-data" | "urlencoded" | "binary" | "graphql",
	) => {
		setMode(newMode);
		if (newMode === "none") {
			onChange(undefined);
		} else if (newMode === "raw") {
			onChange({ type: "raw", raw: { content: "", format: "json" } } as any);
		} else if (newMode === "form-data") {
			onChange({ type: "form-data", formData: [] } as any);
		} else if (newMode === "urlencoded") {
			onChange({ type: "urlencoded", urlencoded: [] } as any);
		} else if (newMode === "binary") {
			onChange({ type: "binary", binary: { file: "" } } as any);
		} else if (newMode === "graphql") {
			onChange({
				type: "graphql",
				graphql: { query: "", variables: "" },
			} as any);
		}
	};

	const handleRawTypeChange = (format: any) => {
		if (typeof body === "object" && body?.type === "raw") {
			onChange({
				...(body as any),
				raw: { ...(body as any).raw, format },
			} as any);
		}
	};

	const handleRawChange = (content: string) => {
		if (typeof body === "object" && body?.type === "raw") {
			onChange({
				...(body as any),
				raw: { ...(body as any).raw, content },
			} as any);
		}
	};

	const handleFormatJson = () => {
		if (typeof body === "object" && body?.type === "raw") {
			const content = (body as any).raw?.content || "";
			try {
				const parsed = JSON.parse(content);
				const formatted = JSON.stringify(parsed, null, 2);
				onChange({
					...(body as any),
					raw: { ...(body as any).raw, content: formatted },
				} as any);
			} catch (_err) {
				// Invalid JSON, do nothing or just log
				console.warn("Could not format: invalid JSON");
			}
		}
	};

	const handleGraphqlQueryChange = (query: string) => {
		if (typeof body === "object" && body?.type === "graphql") {
			onChange({
				...(body as any),
				graphql: { ...(body as any).graphql, query },
			} as any);
		}
	};

	const handleGraphqlVarsChange = (variables: string) => {
		if (typeof body === "object" && body?.type === "graphql") {
			onChange({
				...(body as any),
				graphql: { ...(body as any).graphql, variables },
			} as any);
		}
	};

	const handleFileSelect = async (
		e: React.ChangeEvent<HTMLInputElement>,
		callback: (path: string) => void,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const res = await uploadFile(file);
			callback(res.path);
		} catch (err) {
			console.error("Failed to upload file:", err);
			alert("Failed to upload file");
		}
	};

	const handleRowsChange = (newRows: any[]) => {
		if (
			typeof body === "object" &&
			(body?.type === "form-data" || body?.type === "urlencoded")
		) {
			const key = body.type === "form-data" ? "formData" : "urlencoded";
			onChange({ ...(body as any), [key]: newRows } as any);
		}
	};

	const handleRowAdd = () => {
		if (
			typeof body === "object" &&
			(body?.type === "form-data" || body?.type === "urlencoded")
		) {
			const key = body.type === "form-data" ? "formData" : "urlencoded";
			const items = (body as any)[key] || [];
			onChange({
				...(body as any),
				[key]: [...items, { key: "", value: "", type: "text" as const }],
			} as any);
		}
	};

	return (
		<div className="flex flex-col h-full bg-background min-w-0">
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 border-b bg-card shrink-0 text-sm">
				<label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
					<input
						type="radio"
						className="accent-primary"
						checked={mode === "none"}
						onChange={() => handleModeChange("none")}
					/>{" "}
					none
				</label>
				<label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
					<input
						type="radio"
						className="accent-primary"
						checked={mode === "form-data"}
						onChange={() => handleModeChange("form-data")}
					/>{" "}
					form-data
				</label>
				<label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
					<input
						type="radio"
						className="accent-primary"
						checked={mode === "urlencoded"}
						onChange={() => handleModeChange("urlencoded")}
					/>{" "}
					x-www-form-urlencoded
				</label>
				<label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
					<input
						type="radio"
						className="accent-primary"
						checked={mode === "raw"}
						onChange={() => handleModeChange("raw")}
					/>{" "}
					raw
				</label>
				<label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
					<input
						type="radio"
						className="accent-primary"
						checked={mode === "binary"}
						onChange={() => handleModeChange("binary")}
					/>{" "}
					binary
				</label>
				<label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
					<input
						type="radio"
						className="accent-primary"
						checked={mode === "graphql"}
						onChange={() => handleModeChange("graphql")}
					/>{" "}
					GraphQL
				</label>

				{mode === "raw" && typeof body === "object" && body?.type === "raw" && (
					<div className="ml-auto flex items-center gap-2.5">
						{(body as any).raw?.format === "json" && (
							<Button
								onClick={handleFormatJson}
								variant="ghost"
								size="sm"
								className="text-xs h-7"
							>
								Beautify
							</Button>
						)}
						<select
							className="bg-muted border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground cursor-pointer outline-none focus:border-primary transition-colors"
							value={(body as any).raw?.format || "json"}
							onChange={(e) => handleRawTypeChange(e.target.value)}
						>
							<option value="text">Text</option>
							<option value="javascript">JavaScript</option>
							<option value="json">JSON</option>
							<option value="html">HTML</option>
							<option value="xml">XML</option>
						</select>
					</div>
				)}
			</div>

			<div className="flex-1 overflow-auto flex flex-col">
				{mode === "none" && (
					<div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
						This request does not have a body
					</div>
				)}

				{mode === "raw" && typeof body === "object" && body?.type === "raw" && (
					<div className="flex-1 overflow-auto border-t-0">
						<CodeEditor
							value={(body as any).raw?.content || ""}
							onChange={handleRawChange}
							language={
								(body as any).raw?.format === "javascript"
									? "javascript"
									: (body as any).raw?.format === "json"
										? "json"
										: "text"
							}
							variables={variables}
							style={{ height: "100%" }}
						/>
					</div>
				)}

				{mode === "binary" &&
					typeof body === "object" &&
					body?.type === "binary" && (
						<div className="p-5">
							<p className="text-sm mb-2 text-foreground">
								Selected File:{" "}
								<span className="font-mono text-muted-foreground">
									{(body as any).binary?.file || "None"}
								</span>
							</p>
							<input
								type="file"
								onChange={(e) =>
									handleFileSelect(e, (path) =>
										onChange({ type: "binary", binary: { file: path } } as any),
									)
								}
							/>
						</div>
					)}

				{mode === "graphql" &&
					typeof body === "object" &&
					body?.type === "graphql" && (
						<div className="flex flex-col h-full">
							<div className="flex-[2] flex flex-col">
								<PaneHeader title="Query" />
								<div className="flex-1 overflow-auto border-t-0">
									<CodeEditor
										value={(body as any).graphql?.query || ""}
										onChange={handleGraphqlQueryChange}
										language="javascript"
										variables={variables}
										style={{ height: "100%" }}
									/>
								</div>
							</div>
							<div className="flex-1 flex flex-col border-t border-border">
								<PaneHeader title="Variables" />
								<div className="flex-1 overflow-auto border-t-0">
									<CodeEditor
										value={(body as any).graphql?.variables || ""}
										onChange={handleGraphqlVarsChange}
										language="json"
										variables={variables}
										style={{ height: "100%" }}
									/>
								</div>
							</div>
						</div>
					)}

				{(mode === "form-data" || mode === "urlencoded") &&
					typeof body === "object" &&
					(body?.type === "form-data" || body?.type === "urlencoded") && (
						<KeyValueEditor
							rows={
								(body as any)[
									mode === "form-data" ? "formData" : "urlencoded"
								] || []
							}
							onChange={handleRowsChange}
							onAdd={handleRowAdd}
							renderKey={(item, idx, update) => (
								<>
									<input
										type="text"
										className="flex-1 bg-transparent border-none outline-none text-xs px-2 py-1 text-foreground"
										value={item.key}
										onChange={(e) => update("key", e.target.value)}
										placeholder="Key"
									/>
									{mode === "form-data" && (
										<select
											className="bg-muted border border-border rounded px-1 py-0.5 text-[10px] ml-1 focus:outline-none"
											value={item.type || "text"}
											onChange={(e) => update("type", e.target.value)}
										>
											<option value="text">Text</option>
											<option value="file">File</option>
										</select>
									)}
								</>
							)}
							renderValue={(item, idx, update) => {
								if (item.type === "file") {
									return (
										<div className="flex items-center gap-1.5 flex-1 px-2">
											<span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
												{item.filePath || "No file selected"}
											</span>
											<input
												type="file"
												className="text-[10px] w-full"
												onChange={(e) =>
													handleFileSelect(e, (path) =>
														update("filePath", path),
													)
												}
											/>
										</div>
									);
								}
								return (
									<input
										type="text"
										className="flex-1 bg-transparent border-none outline-none text-xs px-2 py-1 text-foreground"
										value={item.value || ""}
										onChange={(e) => update("value", e.target.value)}
										placeholder="Value"
									/>
								);
							}}
						/>
					)}
			</div>
		</div>
	);
}
