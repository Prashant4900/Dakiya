import { useEffect, useRef, useState } from "react";

type VersionSwitcherProps = {
	versions: string[];
	activeVersion: string | null;
	onVersionChange: (name: string) => void;
};

export function VersionSwitcher({
	versions,
	activeVersion,
	onVersionChange,
}: VersionSwitcherProps) {
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

	if (!activeVersion || versions.length === 0) return null;

	return (
		<div className={`env-switcher${open ? " open" : ""}`} ref={ref}>
			<button
				type="button"
				className="env-switcher-trigger"
				onClick={() => setOpen((v) => !v)}
			>
				<span className="env-name">Version: {activeVersion}</span>
				<span className="env-arrow">▾</span>
			</button>
			<div className="env-dropdown">
				{versions.map((name) => (
					<button
						key={name}
						type="button"
						className={`env-option${name === activeVersion ? " active" : ""}`}
						onClick={() => {
							onVersionChange(name);
							setOpen(false);
						}}
					>
						<span className="dot" />
						{name}
					</button>
				))}
			</div>
		</div>
	);
}
