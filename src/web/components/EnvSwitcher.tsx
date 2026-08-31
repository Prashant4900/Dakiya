import { useEffect, useRef, useState } from "react";
import { Button } from "./Button.js";

type EnvSwitcherProps = {
	environments: string[];
	activeEnv: string;
	onEnvChange: (name: string) => void;
	onManage: () => void;
};

export function EnvSwitcher({
	environments,
	activeEnv,
	onEnvChange,
	onManage,
}: EnvSwitcherProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("click", onDocClick);
		return () => document.removeEventListener("click", onDocClick);
	}, []);

	return (
		<div className={`env-switcher${open ? " open" : ""}`} ref={ref}>
			<Button
				className="env-switcher-trigger"
				onClick={() => setOpen((v) => !v)}
				variant="unstyled"
			>
				<span className="env-dot" />
				<span className="env-name">{activeEnv}</span>
				<span className="env-arrow">▾</span>
			</Button>
			<div className="env-dropdown">
				{environments.map((name) => (
					<Button
						key={name}
						className={`env-option${name === activeEnv ? " active" : ""}`}
						onClick={() => {
							onEnvChange(name);
							setOpen(false);
						}}
						variant="unstyled"
					>
						<span className="dot" />
						{name}
					</Button>
				))}
				<Button
					className="env-option env-option-edit"
					onClick={() => {
						setOpen(false);
						onManage();
					}}
					variant="unstyled"
				>
					Manage environments →
				</Button>
			</div>
		</div>
	);
}
