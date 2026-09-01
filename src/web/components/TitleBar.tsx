import { SidebarLeftIcon, SidebarRightIcon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { useStore } from "../store.js";

type TitleBarProps = {
	projectName: string;
	requestName: string | null;
};

export function TitleBar({ projectName, requestName }: TitleBarProps) {
	const {
		sidebarCollapsed,
		setSidebarCollapsed,
		responseCollapsed,
		setResponseCollapsed,
	} = useStore();
	return (
		<div className="flex items-center px-[14px] gap-[10px] shrink-0 h-10 bg-card border-b shadow-sm">
			<div className="flex items-center gap-1 w-[60px] justify-start">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-muted-foreground"
					onClick={() => setSidebarCollapsed((c) => !c)}
					title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
				>
					<SidebarLeftIcon size={16} />
				</Button>
			</div>
			<div className="flex flex-1 items-center justify-center gap-2">
				<span className="text-xs font-medium text-muted-foreground">
					{projectName}
				</span>
				{requestName && (
					<>
						<span className="text-xs text-muted-foreground">/</span>
						<span className="text-xs font-medium text-foreground">
							{requestName}
						</span>
					</>
				)}
			</div>
			<div className="flex items-center gap-1 w-[60px] justify-end">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-muted-foreground"
					onClick={() => setResponseCollapsed((c) => !c)}
					title={
						responseCollapsed ? "Show response panel" : "Hide response panel"
					}
				>
					<SidebarRightIcon size={16} />
				</Button>
			</div>
		</div>
	);
}
