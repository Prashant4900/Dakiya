import type { ReactNode } from "react";
import { Modal } from "./Modal.js";

export interface ConfirmDialogProps {
	title: string;
	message: ReactNode;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	isDestructive?: boolean;
}

export function ConfirmDialog({
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
	isDestructive = false,
}: ConfirmDialogProps) {
	return (
		<Modal onClose={onCancel} titleId="confirm-dialog-title">
			<div className="modal-header">
				<h2 id="confirm-dialog-title">{title}</h2>
			</div>
			<div style={{ padding: "0 24px", color: "var(--text-color)" }}>
				{message}
			</div>
			<div className="modal-actions">
				<button type="button" className="pane-action-btn" onClick={onCancel}>
					{cancelText}
				</button>
				<button
					type="button"
					className="send-button"
					style={
						isDestructive
							? {
									background: "var(--danger-bg, #ffecec)",
									color: "var(--danger-text, #d03030)",
									border: "1px solid var(--danger-border, #ffcccc)",
								}
							: undefined
					}
					onClick={onConfirm}
				>
					{confirmText}
				</button>
			</div>
		</Modal>
	);
}
