import { Button } from "./Button.js";
import { SidebarLeftIcon } from "./icons/SidebarLeftIcon.js";
import { SidebarRightIcon } from "./icons/SidebarRightIcon.js";

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
					className="sidebar-toggle"
					onClick={onToggleSidebar}
					title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
					icon={<SidebarLeftIcon size={16} />}
					variant="icon"
				/>
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
					className="sidebar-toggle"
					onClick={onToggleResponse}
					title={
						responseCollapsed ? "Show response panel" : "Hide response panel"
					}
					icon={<SidebarRightIcon size={16} />}
					variant="icon"
				/>
			</div>
		</div>
	);
}
