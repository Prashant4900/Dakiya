import { useEffect, useRef, useState } from "react";
import { Button } from "./Button.js";
import { Modal } from "./Modal.js";

export interface PromptDialogProps {
	title: string;
	message?: string;
	defaultValue?: string;
	placeholder?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: (value: string) => void;
	onCancel: () => void;
}

export function PromptDialog({
	title,
	message,
	defaultValue = "",
	placeholder = "",
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
}: PromptDialogProps) {
	const [value, setValue] = useState(defaultValue);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Focus input when dialog opens
		inputRef.current?.focus();
		// Select all if there is a default value
		if (defaultValue) {
			inputRef.current?.select();
		}
	}, [defaultValue]);

	return (
		<Modal onClose={onCancel} titleId="prompt-dialog-title" maxWidth="420px">
			<h2 id="prompt-dialog-title" className="modal-title">
				{title}
			</h2>
			{message && (
				<div style={{ marginBottom: "16px", color: "var(--muted)" }}>
					{message}
				</div>
			)}
			<div style={{ marginBottom: "24px" }}>
				<input
					ref={inputRef}
					type="text"
					className="kv-input"
					style={{
						width: "100%",
						padding: "8px 12px",
						border: "1px solid var(--border-strong)",
						borderRadius: "var(--radius)",
						background: "var(--surface)",
						color: "var(--foreground)",
					}}
					placeholder={placeholder}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && value.trim()) {
							onConfirm(value.trim());
						}
					}}
				/>
			</div>
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
				<Button variant="secondary" onClick={onCancel}>
					{cancelText}
				</Button>
				<Button
					variant="primary"
					onClick={() => onConfirm(value.trim())}
					disabled={!value.trim()}
				>
					{confirmText}
				</Button>
			</div>
		</Modal>
	);
}
