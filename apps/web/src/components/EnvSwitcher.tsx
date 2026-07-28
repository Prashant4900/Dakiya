import { useEffect, useRef, useState } from "react";

type EnvSwitcherProps = {
	environments: string[];
	activeEnv: string;
	onEnvChange: (name: string) => void;
	onEdit: () => void;
};

export function EnvSwitcher({
	environments,
	activeEnv,
	onEnvChange,
	onEdit,
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
			<button
				type="button"
				className="env-switcher-trigger"
				onClick={() => setOpen((v) => !v)}
			>
				<span className="env-dot" />
				<span className="env-name">{activeEnv}</span>
				<span className="env-arrow">▾</span>
			</button>
			<div className="env-dropdown">
				{environments.map((name) => (
					<button
						key={name}
						type="button"
						className={`env-option${name === activeEnv ? " active" : ""}`}
						onClick={() => {
							onEnvChange(name);
							setOpen(false);
						}}
					>
						<span className="dot" />
						{name}
					</button>
				))}
				<button
					type="button"
					className="env-option env-option-edit"
					onClick={() => {
						setOpen(false);
						onEdit();
					}}
				>
					Edit environment…
				</button>
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
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
		<div
			className="modal-backdrop"
			role="presentation"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="modal" role="dialog" aria-labelledby="env-editor-title">
				<div className="modal-header">
					<h2 id="env-editor-title">Environment: {name}</h2>
					<button type="button" className="pane-action-btn" onClick={onClose}>
						Close
					</button>
				</div>
				<textarea
					className="editor env-editor mono"
					value={source}
					onChange={(e) => onChange(e.target.value)}
					spellCheck={false}
				/>
				{error && <p className="error-text modal-error">{error}</p>}
				<div className="modal-actions">
					<button
						type="button"
						className="send-button"
						onClick={onSave}
						disabled={saving}
					>
						{saving ? "Saving…" : "Save"}
					</button>
				</div>
			</div>
		</div>
	);
}
