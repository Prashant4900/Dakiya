import type { ReactNode } from "react";

export interface PaneHeaderProps {
	title: string;
	tag?: string;
	children?: ReactNode;
	className?: string;
}

export function PaneHeader({
	title,
	tag,
	children,
	className = "",
}: PaneHeaderProps) {
	return (
		<div
			className={`pane-header ${className}`.trim()}
			style={
				children
					? {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}
					: undefined
			}
		>
			<div>
				<span className="pane-title">{title}</span>
				{tag && <span className="pane-tag">{tag}</span>}
			</div>
			{children && <div>{children}</div>}
		</div>
	);
}
