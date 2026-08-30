import { useState } from "react";
import { Button } from "./Button.js";
import { Cancel01Icon } from "./icons/Cancel01Icon.js";
import { Modal } from "./Modal.js";

const HTTP_METHODS = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
];

export interface NewRequestModalProps {
	activeVersion: string | null;
	defaultVersionName: string;
	folders?: string[];
	onClose: () => void;
	onCreate: (path: string, method: string) => void;
}

export function NewRequestModal({
	activeVersion,
	defaultVersionName,
	folders = [],
	onClose,
	onCreate,
}: NewRequestModalProps) {
	const version = activeVersion ?? "v1";
	const isVersioned = activeVersion !== defaultVersionName;
	const [folder, setFolder] = useState("");
	const [name, setName] = useState("");
	const [method, setMethod] = useState("GET");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) return;
		const basePath = isVersioned
			? folder.trim()
				? `${version}/${folder.trim()}`
				: version
			: folder.trim();
		onCreate(basePath, `${method.toLowerCase()}-${trimmedName}`);
	};

	return (
		<Modal onClose={onClose} titleId="new-request-modal-title" maxWidth="460px">
			<div className="modal-header">
				<h2 id="new-request-modal-title">New Request</h2>
				<Button
					variant="icon"
					onClick={onClose}
					aria-label="Close"
					icon={<Cancel01Icon size={18} />}
					style={{ color: "var(--text-muted)" }}
				/>
			</div>

			<form onSubmit={handleSubmit}>
				<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
					<label
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "6px",
							fontSize: "13px",
						}}
					>
						<span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
							Method
						</span>
						<select
							value={method}
							onChange={(e) => setMethod(e.target.value)}
							style={{
								background: "var(--input-bg, var(--surface))",
								color: "var(--text-color)",
								border: "1px solid var(--border)",
								borderRadius: "var(--radius, 6px)",
								padding: "6px 10px",
								fontSize: "13px",
								cursor: "pointer",
							}}
						>
							{HTTP_METHODS.map((m) => (
								<option key={m} value={m}>
									{m}
								</option>
							))}
						</select>
					</label>

					<label
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "6px",
							fontSize: "13px",
						}}
					>
						<span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
							Request name <span style={{ color: "var(--del)" }}>*</span>
						</span>
						<input
							// biome-ignore lint/a11y/noAutofocus: intentional focus on open
							autoFocus
							type="text"
							className="search-input"
							placeholder="e.g. get-user"
							value={name}
							onChange={(e) => setName(e.target.value)}
							style={{ width: "100%", boxSizing: "border-box" }}
						/>
					</label>

					<label
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "6px",
							fontSize: "13px",
						}}
					>
						<span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
							Folder{" "}
							<span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
								(optional, e.g. users)
							</span>
						</span>
						<input
							type="text"
							list="folder-list"
							className="search-input"
							placeholder={
								isVersioned ? `inside ${version}/` : "inside root or folder/"
							}
							value={folder}
							onChange={(e) => setFolder(e.target.value)}
							style={{ width: "100%", boxSizing: "border-box" }}
						/>
						{folders.length > 0 && (
							<datalist id="folder-list">
								{folders.map((f) => (
									<option key={f} value={f} />
								))}
							</datalist>
						)}
					</label>

					<p
						style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}
					>
						Will be created at:{" "}
						<code style={{ fontSize: "12px" }}>
							{isVersioned ? `${version}/` : ""}
							{folder.trim() ? `${folder.trim()}/` : ""}
							{method.toLowerCase()}-{name.trim() || "<name>"}
						</code>
					</p>
				</div>

				<div className="modal-actions">
					<Button type="button" variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" variant="primary" disabled={!name.trim()}>
						Create
					</Button>
				</div>
			</form>
		</Modal>
	);
}
