import type { ReactNode } from "react";
import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
	className = "",
	children,
}: TabsProps<T>) {
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<ShadcnTabs value={activeTab} onValueChange={(v) => onChange(v as T)}>
				<TabsList className="bg-muted/50 h-9 p-1">
					{tabs.map((t) => (
						<TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-xs h-7 data-[state=active]:shadow-sm px-3">
							{t.label}
							{t.badge !== undefined && t.badge > 0 && (
								<span className="bg-primary/20 text-primary text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold min-w-4 text-center">
									{t.badge}
								</span>
							)}
						</TabsTrigger>
					))}
				</TabsList>
			</ShadcnTabs>
			{children}
		</div>
	);
}
