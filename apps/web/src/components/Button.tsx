import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "ghost"
	| "destructive"
	| "dashed"
	| "icon"
	| "unstyled";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	icon?: ReactNode;
	children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
	variant = "primary",
	className = "",
	style,
	icon,
	children,
	...props
}, ref) => {
	let baseClass = "";
	let customStyle: React.CSSProperties = { ...style };
	const isActionVariant = ["ghost", "dashed", "icon"].includes(variant);

	switch (variant) {
		case "primary":
			baseClass = "send-button";
			break;
		case "secondary":
			baseClass = "save-button";
			break;
		case "ghost":
			customStyle = {
				background: "transparent",
				border: "1px solid var(--border-color, var(--border))",
				color: "var(--text-color, var(--foreground))",
				padding: "4px 8px",
				borderRadius: "4px",
				display: "inline-flex",
				alignItems: "center",
				gap: "4px",
				fontSize: "12px",
				opacity: 0.8,
				cursor: "pointer",
				...customStyle,
			};
			break;
		case "dashed":
			customStyle = {
				background: "transparent",
				border: "1px dashed var(--border-color, var(--border))",
				color: "var(--text-color, var(--foreground))",
				padding: "4px 8px",
				borderRadius: "4px",
				display: "inline-flex",
				alignItems: "center",
				gap: "4px",
				fontSize: "12px",
				opacity: 0.8,
				cursor: "pointer",
				...customStyle,
			};
			break;
		case "icon":
			customStyle = {
				background: "transparent",
				border: "none",
				color: "inherit",
				padding: "4px",
				borderRadius: "4px",
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				opacity: 0.8,
				cursor: "pointer",
				...customStyle,
			};
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
			ref={ref}
			type="button"
			className={`${baseClass} ${className}`.trim()}
			style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
			onMouseEnter={
				isActionVariant
					? (e) => {
							e.currentTarget.style.opacity = "1";
							if (props.onMouseEnter) props.onMouseEnter(e);
						}
					: props.onMouseEnter
			}
			onMouseLeave={
				isActionVariant
					? (e) => {
							e.currentTarget.style.opacity = "0.8";
							if (props.onMouseLeave) props.onMouseLeave(e);
						}
					: props.onMouseLeave
			}
			{...props}
		>
			{icon}
			{children}
		</button>
	);
});
