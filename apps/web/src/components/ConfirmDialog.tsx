import type { ReactNode } from "react";
import { Button } from "./Button.js";
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
		<Modal onClose={onCancel} titleId="confirm-dialog-title" maxWidth="420px">
			<div className="modal-header">
				<h2 id="confirm-dialog-title">{title}</h2>
			</div>
			<div
				style={{
					color: "var(--text-color)",
					fontSize: "14px",
					lineHeight: "1.5",
				}}
			>
				{message}
			</div>
			<div className="modal-actions">
				<Button variant="secondary" onClick={onCancel}>
					{cancelText}
				</Button>
				<Button
					variant={isDestructive ? "destructive" : "primary"}
					onClick={onConfirm}
				>
					{confirmText}
				</Button>
			</div>
		</Modal>
	);
}
