type TitleBarProps = {
	projectName: string;
	requestName: string | null;
};

export function TitleBar({ projectName, requestName }: TitleBarProps) {
	return (
		<div className="titlebar">
			<div className="traffic-lights">
				<div className="tl tl-close" />
				<div className="tl tl-min" />
				<div className="tl tl-max" />
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
			<div className="titlebar-actions" />
		</div>
	);
}
