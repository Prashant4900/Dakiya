import { useEffect, useRef, useState } from "react";
import { Button } from "./Button.js";
import { CodeEditor } from "./CodeEditor.js";
import { Modal } from "./Modal.js";

type EnvSwitcherProps = {
	environments: string[];
	activeEnv: string;
	onEnvChange: (name: string) => void;
	onManage: () => void;
};

export function EnvSwitcher({
	environments,
	activeEnv,
	onEnvChange,
	onManage,
}: EnvSwitcherProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("click", onDocClick);
		return () => document.removeEventListener("click", onDocClick);
	}, []);

	return (
		<div className={`env-switcher${open ? " open" : ""}`} ref={ref}>
			<Button
				className="env-switcher-trigger"
				onClick={() => setOpen((v) => !v)}
				variant="unstyled"
			>
				<span className="env-dot" />
				<span className="env-name">{activeEnv}</span>
				<span className="env-arrow">▾</span>
			</Button>
			<div className="env-dropdown">
				{environments.map((name) => (
					<Button
						key={name}
						className={`env-option${name === activeEnv ? " active" : ""}`}
						onClick={() => {
							onEnvChange(name);
							setOpen(false);
						}}
						variant="unstyled"
					>
						<span className="dot" />
						{name}
					</Button>
				))}
				<Button
					className="env-option env-option-edit"
					onClick={() => {
						setOpen(false);
						onManage();
					}}
					variant="unstyled"
				>
					Manage environments →
				</Button>
			</div>
		</div>
	);
}


type EnvEditorProps = {
	name: string;
	source: string;
	error?: string | null;
	onChange: (source: string) => void;
	onSave: () => void;
	onClose: () => void;
	saving: boolean;
};

export function EnvEditor({
	name,
	source,
	error,
	onChange,
	onSave,
	onClose,
	saving,
}: EnvEditorProps) {
	return (
		<Modal onClose={onClose} titleId="env-editor-title">
			<div className="modal-header">
				<h2 id="env-editor-title">Environment: {name}</h2>
				<Button variant="ghost" onClick={onClose}>
					Close
				</Button>
			</div>
			<div
				style={{
					flex: 1,
					borderTop: "1px solid var(--border-color)",
					borderBottom: "1px solid var(--border-color)",
					overflow: "auto",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<CodeEditor
					value={source}
					onChange={onChange}
					language="json"
					style={{ flex: 1, height: "300px" }}
				/>
			</div>
			{error && <p className="error-text modal-error">{error}</p>}
			<div className="modal-actions">
				<Button variant="primary" onClick={onSave} disabled={saving}>
					{saving ? "Saving…" : "Save"}
				</Button>
			</div>
		</Modal>
	);
}
