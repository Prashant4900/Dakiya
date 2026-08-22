import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
	onClose: () => void;
	titleId?: string;
	children: ReactNode;
}

export function Modal({ onClose, titleId, children }: ModalProps) {
	return createPortal(
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
		<div
			className="modal-backdrop"
			role="presentation"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="modal" role="dialog" aria-labelledby={titleId}>
				{children}
			</div>
		</div>,
		document.body,
	);
}
