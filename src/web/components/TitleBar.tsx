import { SidebarLeftIcon, SidebarRightIcon } from "hugeicons-react";
import { Button } from "@/components/ui/button";

type TitleBarProps = {
	projectName: string;
	requestName: string | null;
	sidebarCollapsed: boolean;
	onToggleSidebar: () => void;
	responseCollapsed: boolean;
	onToggleResponse: () => void;
};

export function TitleBar({
	projectName,
	requestName,
	sidebarCollapsed,
	onToggleSidebar,
	responseCollapsed,
	onToggleResponse,
}: TitleBarProps) {
	return (
		<div className="titlebar">
			<div className="titlebar-actions left">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-muted-foreground"
					onClick={onToggleSidebar}
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
					onClick={onToggleResponse}
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
