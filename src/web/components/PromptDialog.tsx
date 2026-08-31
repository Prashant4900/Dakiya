import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PromptDialogProps {
	title: string;
	message?: string;
	defaultValue?: string;
	placeholder?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: (value: string) => void;
	onCancel: () => void;
}

export function PromptDialog({
	title,
	message,
	defaultValue = "",
	placeholder = "",
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
}: PromptDialogProps) {
	const [value, setValue] = useState(defaultValue);
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
                if (defaultValue) inputRef.current?.select();
            }}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{message && <DialogDescription>{message}</DialogDescription>}
				</DialogHeader>
				<div className="py-4">
					<Input
						ref={inputRef}
						placeholder={placeholder}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && value.trim()) {
								onConfirm(value.trim());
							}
						}}
					/>
				</div>
				<DialogFooter>
					<Button variant="secondary" onClick={onCancel}>
						{cancelText}
					</Button>
					<Button
						onClick={() => onConfirm(value.trim())}
						disabled={!value.trim()}
					>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
