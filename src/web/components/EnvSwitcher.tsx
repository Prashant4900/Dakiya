import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="w-full justify-between font-medium h-8 px-2 shadow-sm text-sm">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(26,127,90,0.6)]" />
						<span className="truncate">{activeEnv}</span>
					</div>
					<ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-52" align="start">
				{environments.map((name) => (
					<DropdownMenuItem
						key={name}
						onClick={() => onEnvChange(name)}
						className="flex items-center gap-2 cursor-pointer text-sm py-1.5"
					>
						<span className={`h-2 w-2 rounded-full ${name === activeEnv ? "bg-primary shadow-[0_0_8px_rgba(26,127,90,0.6)]" : "bg-transparent border border-muted-foreground"}`} />
						<span className="truncate">{name}</span>
					</DropdownMenuItem>
				))}
				<DropdownMenuItem
					onClick={onManage}
					className="text-primary mt-1 border-t rounded-none pt-2 pb-1.5 cursor-pointer font-medium focus:text-primary focus:bg-primary/10 transition-colors"
				>
					Manage environments &rarr;
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
