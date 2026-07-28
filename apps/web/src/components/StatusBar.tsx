type StatusBarProps = {
	workspaceName: string;
	activeEnv: string;
	sending: boolean;
};

export function StatusBar({
	workspaceName,
	activeEnv,
	sending,
}: StatusBarProps) {
	return (
		<div className="status-bar">
			<div className="status-item">
				<div className="status-dot" />
				<span>.dakiya linked</span>
			</div>
			<div className="status-divider" />
			<div className="status-item">
				<span>{workspaceName}/</span>
			</div>
			<div className="status-divider" />
			<div className="status-item">
				<span className="status-env-dot">●</span>
				<span>{activeEnv}</span>
			</div>
			{sending && (
				<div className="status-item status-sending">
					<span>Sending…</span>
				</div>
			)}
			<div className="status-item status-item-right">
				<span>offline ready</span>
			</div>
		</div>
	);
}
