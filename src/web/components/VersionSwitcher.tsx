import { ArrowDown01Icon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
	if (!activeVersion || versions.length === 0) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-8 text-xs font-medium px-2 gap-1.5 shadow-none w-full justify-between"
				>
					<span className="truncate">Version: {activeVersion}</span>
					<ArrowDown01Icon
						size={14}
						className="text-muted-foreground opacity-50"
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[140px]"
			>
				{versions.map((name) => (
					<DropdownMenuItem
						key={name}
						onClick={() => onVersionChange(name)}
						className={`text-xs ${name === activeVersion ? "font-semibold bg-primary/10 text-primary" : ""}`}
					>
						{name}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
