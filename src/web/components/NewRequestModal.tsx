import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cancel01Icon } from "hugeicons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HTTP_METHODS = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
];

export interface NewRequestModalProps {
	activeVersion: string | null;
	defaultVersionName: string;
	folders?: string[];
	onClose: () => void;
	onCreate: (path: string, method: string) => void;
}

export function NewRequestModal({
	activeVersion,
	defaultVersionName,
	folders = [],
	onClose,
	onCreate,
}: NewRequestModalProps) {
	const version = activeVersion ?? "v1";
	const isVersioned = activeVersion !== defaultVersionName;
	const [folder, setFolder] = useState("");
	const [name, setName] = useState("");
	const [method, setMethod] = useState("GET");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) return;
		const basePath = isVersioned
			? folder.trim()
				? `${version}/${folder.trim()}`
				: version
			: folder.trim();
		onCreate(basePath, `${method.toLowerCase()}-${trimmedName}`);
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[460px]">
				<DialogHeader>
					<DialogTitle>New Request</DialogTitle>
				</DialogHeader>
				
				<form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
					<div className="flex flex-col gap-2">
						<Label className="text-muted-foreground font-medium">Method</Label>
						<select
							value={method}
							onChange={(e) => setMethod(e.target.value)}
							className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
						>
							{HTTP_METHODS.map((m) => (
								<option key={m} value={m} className="bg-background text-foreground">
									{m}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="text-muted-foreground font-medium">
							Request name <span className="text-destructive">*</span>
						</Label>
						<Input
							// biome-ignore lint/a11y/noAutofocus: intentional focus on open
							autoFocus
							type="text"
							placeholder="e.g. get-user"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<Label className="text-muted-foreground font-medium flex items-baseline gap-1">
							Folder
							<span className="text-xs font-normal opacity-70">
								(optional, e.g. users)
							</span>
						</Label>
						<Input
							type="text"
							list="folder-list"
							placeholder={isVersioned ? `inside ${version}/` : "inside root or folder/"}
							value={folder}
							onChange={(e) => setFolder(e.target.value)}
						/>
						{folders.length > 0 && (
							<datalist id="folder-list">
								{folders.map((f) => (
									<option key={f} value={f} />
								))}
							</datalist>
						)}
					</div>

					<p className="text-xs text-muted-foreground mt-2">
						Will be created at:{" "}
						<code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">
							{isVersioned ? `${version}/` : ""}
							{folder.trim() ? `${folder.trim()}/` : ""}
							{method.toLowerCase()}-{name.trim() || "<name>"}
						</code>
					</p>

					<DialogFooter className="mt-4">
						<Button type="button" variant="secondary" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={!name.trim()}>
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
