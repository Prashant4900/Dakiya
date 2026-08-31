import type { ReactNode } from "react";
import { Button } from "./Button.js";

export interface TabOption<T extends string> {
	id: T;
	label: string;
	badge?: number;
}

export interface TabsProps<T extends string> {
	tabs: TabOption<T>[];
	activeTab: T;
	onChange: (id: T) => void;
	className?: string;
	children?: ReactNode;
}

export function Tabs<T extends string>({
	tabs,
	activeTab,
	onChange,
	className = "request-tabs",
	children,
}: TabsProps<T>) {
	return (
		<div className={className}>
			{tabs.map((t) => (
				<Button
					key={t.id}
					className={`tab-item${activeTab === t.id ? " active" : ""}`}
					onClick={() => onChange(t.id)}
					variant="unstyled"
				>
					{t.label}
					{t.badge !== undefined && t.badge > 0 && (
						<span className="tab-badge">{t.badge}</span>
					)}
				</Button>
			))}
			{children}
		</div>
	);
}
