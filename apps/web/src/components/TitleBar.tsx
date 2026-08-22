import { SidebarLeftIcon, SidebarRightIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
				<button
					type="button"
					className="sidebar-toggle"
					onClick={onToggleSidebar}
					title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
				>
					<HugeiconsIcon icon={SidebarLeftIcon} size={16} />
				</button>
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
				<button
					type="button"
					className="sidebar-toggle"
					onClick={onToggleResponse}
					title={
						responseCollapsed ? "Show response panel" : "Hide response panel"
					}
				>
					<HugeiconsIcon icon={SidebarRightIcon} size={16} />
				</button>
			</div>
		</div>
	);
}
