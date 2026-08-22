import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	children: ReactNode;
}

export function Button({
	variant = "primary",
	className = "",
	style,
	children,
	...props
}: ButtonProps) {
	let baseClass = "";
	let customStyle = { ...style };

	switch (variant) {
		case "primary":
			baseClass = "send-button";
			break;
		case "secondary":
			baseClass = "save-button";
			break;
		case "ghost":
			baseClass = "pane-action-btn";
			break;
		case "destructive":
			baseClass = "send-button";
			customStyle = {
				...customStyle,
				background: "var(--danger-bg, #ffecec)",
				color: "var(--danger-text, #d03030)",
				border: "1px solid var(--danger-border, #ffcccc)",
			};
			break;
	}

	return (
		<button
			type="button"
			className={`${baseClass} ${className}`.trim()}
			style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
			{...props}
		>
			{children}
		</button>
	);
}
