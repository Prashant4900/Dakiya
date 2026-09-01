import { Cancel01Icon } from "hugeicons-react";
import type React from "react";
import { Button } from "./ui/button";

export type KVRow = {
	id?: string;
	key: string;
	value: string;
	[key: string]: any;
};

export type KeyValueEditorProps<T extends KVRow> = {
	rows: T[];
	onChange: (rows: T[]) => void;

	renderKey?: (
		row: T,
		index: number,
		update: (field: keyof T, val: unknown) => void,
	) => React.ReactNode;
	renderValue?: (
		row: T,
		index: number,
		update: (field: keyof T, val: unknown) => void,
	) => React.ReactNode;

	autoAppend?: boolean;
	onAdd?: () => void;

	keyPlaceholder?: string;
	valuePlaceholder?: string;

	onFocus?: React.FocusEventHandler<HTMLTableElement>;
	onBlur?: React.FocusEventHandler<HTMLTableElement>;
};

export function KeyValueEditor<T extends KVRow>({
	rows,
	onChange,
	renderKey,
	renderValue,
	autoAppend,
	onAdd,
	keyPlaceholder = "Key",
	valuePlaceholder = "Value",
	onFocus,
	onBlur,
}: KeyValueEditorProps<T>) {
	const handleUpdate = (index: number, field: keyof T, val: unknown) => {
		const newRows = [...rows];
		newRows[index] = { ...newRows[index], [field]: val };
		onChange(newRows);
	};

	const handleRemove = (index: number) => {
		const newRows = rows.filter((_, i) => i !== index);
		onChange(newRows);
	};

	return (
		<table
			className="kv-table editable-kv-table"
			onFocus={onFocus}
			onBlur={onBlur}
		>
			<thead>
				<tr>
					<th style={{ width: "38%" }}>
						{keyPlaceholder === "variable_name" ? "Variable" : "Key"}
					</th>
					<th>Value</th>
					<th className="kv-actions" />
				</tr>
			</thead>
			<tbody>
				{rows.map((row, index) => {
					const isLast = index === rows.length - 1;
					const showRemove = autoAppend ? !isLast : true;

					return (
						<tr key={row.id ?? index}>
							<td className="kv-key">
								{renderKey ? (
									renderKey(row, index, (field, val) =>
										handleUpdate(index, field, val),
									)
								) : (
									<input
										className="kv-input"
										placeholder={autoAppend && isLast ? keyPlaceholder : "Key"}
										value={row.key}
										onChange={(e) => handleUpdate(index, "key", e.target.value)}
									/>
								)}
							</td>
							<td className="kv-val" style={{ position: "relative" }}>
								{renderValue ? (
									renderValue(row, index, (field, val) =>
										handleUpdate(index, field, val),
									)
								) : (
									<input
										className="kv-input"
										placeholder={
											autoAppend && isLast ? valuePlaceholder : "Value"
										}
										value={row.value}
										onChange={(e) =>
											handleUpdate(index, "value", e.target.value)
										}
									/>
								)}
							</td>
							<td className="kv-actions">
								{showRemove && (
									<Button
										variant="ghost"
										size="icon"
										title="Remove"
										onClick={() => handleRemove(index)}
										className="h-8 w-8 hover:text-destructive"
									>
										<Cancel01Icon size={14} />
									</Button>
								)}
							</td>
						</tr>
					);
				})}
				{onAdd && (
					<tr>
						<td colSpan={3} style={{ padding: "8px" }}>
							<Button
								onClick={onAdd}
								variant="outline"
								size="sm"
								className="border-dashed w-full"
							>
								+ Add Item
							</Button>
						</td>
					</tr>
				)}
			</tbody>
		</table>
	);
}
