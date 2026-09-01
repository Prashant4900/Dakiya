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
		<div className="titlebar">
			<div className="titlebar-actions left">
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
			<div className="titlebar-center">
				<span className="titlebar-project">{projectName}</span>
				{requestName && (
					<>
						<span className="titlebar-sep">/</span>
						<span className="titlebar-request">{requestName}</span>
					</>
				)}
			</div>
			<div className="titlebar-actions right">
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
