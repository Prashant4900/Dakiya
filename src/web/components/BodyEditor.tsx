import type { RequestBody } from "@core/domain";
import { useEffect, useState } from "react";
import { uploadFile } from "../api/client.js";

import { Button } from "./Button.js";
import { CodeEditor } from "./CodeEditor.js";
import { Cancel01Icon } from "./icons/Cancel01Icon.js";
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

	const addKvItem = (type: "form-data" | "urlencoded") => {
		if (typeof body === "object" && body?.type === type) {
			const key = type === "form-data" ? "formData" : "urlencoded";
			const items = (body as any)[key] || [];
			onChange({
				...(body as any),
				[key]: [...items, { key: "", value: "", type: "text" as const }],
			} as any);
		}
	};

	const updateKvItem = (
		type: "form-data" | "urlencoded",
		index: number,
		field: string,
		value: string | boolean,
	) => {
		if (typeof body === "object" && body?.type === type) {
			const key = type === "form-data" ? "formData" : "urlencoded";
			const items = (body as any)[key] || [];
			const newItems = [...items] as any;
			newItems[index] = { ...newItems[index], [field]: value };
			onChange({ ...(body as any), [key]: newItems } as any);
		}
	};

	const removeKvItem = (type: "form-data" | "urlencoded", index: number) => {
		if (typeof body === "object" && body?.type === type) {
			const key = type === "form-data" ? "formData" : "urlencoded";
			const items = (body as any)[key] || [];
			const newItems = items.filter((_: any, i: number) => i !== index);
			onChange({ ...(body as any), [key]: newItems } as any);
		}
	};

	return (
		<div
			className="body-editor"
			style={{ display: "flex", flexDirection: "column", height: "100%" }}
		>
			<div
				className="body-mode-selector"
				style={{
					display: "flex",
					gap: "10px",
					padding: "10px",
					borderBottom: "1px solid var(--border-color)",
				}}
			>
				<label>
					<input
						type="radio"
						checked={mode === "none"}
						onChange={() => handleModeChange("none")}
					/>{" "}
					none
				</label>
				<label>
					<input
						type="radio"
						checked={mode === "form-data"}
						onChange={() => handleModeChange("form-data")}
					/>{" "}
					form-data
				</label>
				<label>
					<input
						type="radio"
						checked={mode === "urlencoded"}
						onChange={() => handleModeChange("urlencoded")}
					/>{" "}
					x-www-form-urlencoded
				</label>
				<label>
					<input
						type="radio"
						checked={mode === "raw"}
						onChange={() => handleModeChange("raw")}
					/>{" "}
					raw
				</label>
				<label>
					<input
						type="radio"
						checked={mode === "binary"}
						onChange={() => handleModeChange("binary")}
					/>{" "}
					binary
				</label>
				<label>
					<input
						type="radio"
						checked={mode === "graphql"}
						onChange={() => handleModeChange("graphql")}
					/>{" "}
					GraphQL
				</label>

				{mode === "raw" && typeof body === "object" && body?.type === "raw" && (
					<div
						style={{
							marginLeft: "auto",
							display: "flex",
							gap: "10px",
							alignItems: "center",
						}}
					>
						{(body as any).raw?.format === "json" && (
							<Button onClick={handleFormatJson} variant="ghost">
								Beautify
							</Button>
						)}
						<select
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

			<div
				className="body-content"
				style={{
					flex: 1,
					overflow: "auto",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{mode === "none" && (
					<div className="pane-empty muted">
						This request does not have a body
					</div>
				)}

				{mode === "raw" && typeof body === "object" && body?.type === "raw" && (
					<div
						style={{
							flex: 1,
							overflow: "auto",
							border: "1px solid var(--border-color)",
							borderTop: "none",
						}}
					>
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
						<div style={{ padding: "20px" }}>
							<p>Selected File: {(body as any).binary?.file || "None"}</p>
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
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								height: "100%",
							}}
						>
							<div
								style={{ flex: 2, display: "flex", flexDirection: "column" }}
							>
								<PaneHeader title="Query" />
								<div
									style={{
										flex: 1,
										overflow: "auto",
										border: "1px solid var(--border-color)",
										borderTop: "none",
									}}
								>
									<CodeEditor
										value={(body as any).graphql?.query || ""}
										onChange={handleGraphqlQueryChange}
										language="javascript"
										variables={variables}
										style={{ height: "100%" }}
									/>
								</div>
							</div>
							<div
								style={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									borderTop: "1px solid var(--border-color)",
								}}
							>
								<PaneHeader title="Variables" />
								<div
									style={{
										flex: 1,
										overflow: "auto",
										border: "1px solid var(--border-color)",
										borderTop: "none",
									}}
								>
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
						<table className="kv-table editable-kv-table">
							<thead>
								<tr>
									<th>Key</th>
									<th>Value</th>
									<th className="kv-actions"></th>
								</tr>
							</thead>
							<tbody>
								{(
									(body as any)[
										mode === "form-data" ? "formData" : "urlencoded"
									] || []
								).map((item: any, idx: number) => (
									<tr key={idx}>
										<td className="kv-key">
											<input
												type="text"
												className="kv-input"
												value={item.key}
												onChange={(e) =>
													updateKvItem(mode, idx, "key", e.target.value)
												}
												placeholder="Key"
											/>
											{mode === "form-data" && (
												<select
													value={item.type || "text"}
													onChange={(e) =>
														updateKvItem(mode, idx, "type", e.target.value)
													}
													style={{ marginLeft: "5px", fontSize: "0.8em" }}
												>
													<option value="text">Text</option>
													<option value="file">File</option>
												</select>
											)}
										</td>
										<td className="kv-val">
											{item.type === "file" ? (
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: "5px",
													}}
												>
													<span
														style={{ fontSize: "0.9em", color: "var(--muted)" }}
													>
														{item.filePath || "No file selected"}
													</span>
													<input
														type="file"
														style={{ fontSize: "0.8em" }}
														onChange={(e) =>
															handleFileSelect(e, (path) =>
																updateKvItem(mode, idx, "filePath", path),
															)
														}
													/>
												</div>
											) : (
												<input
													type="text"
													className="kv-input"
													value={item.value || ""}
													onChange={(e) =>
														updateKvItem(mode, idx, "value", e.target.value)
													}
													placeholder="Value"
												/>
											)}
										</td>
										<td className="kv-actions">
											<Button
												className="kv-remove-btn"
												onClick={() => removeKvItem(mode, idx)}
												icon={<Cancel01Icon size={14} />}
												variant="icon"
											/>
										</td>
									</tr>
								))}
								<tr>
									<td colSpan={3} style={{ padding: "8px" }}>
										<Button onClick={() => addKvItem(mode)} variant="dashed">
											+ Add Item
										</Button>
									</td>
								</tr>
							</tbody>
						</table>
					)}
			</div>
		</div>
	);
}
