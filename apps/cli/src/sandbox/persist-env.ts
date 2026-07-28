import * as fs from "node:fs";
import * as path from "node:path";
import type { EnvironmentVariables } from "@dakiya/domain";
import { dakiyaDir } from "../workspace.js";

/**
 * Merge persisted script vars into environments/<name>.yaml.
 * Preserves comments and untouched keys when possible by rewriting flat YAML.
 */
export function persistEnvironmentVariables(
	envName: string,
	updates: EnvironmentVariables,
	cwd = process.cwd(),
): void {
	if (Object.keys(updates).length === 0) return;

	const file = path.join(dakiyaDir(cwd), "environments", `${envName}.yaml`);
	const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
	const lines = existing.replace(/\r\n/g, "\n").split("\n");
	const seen = new Set<string>();

	const next = lines.map((line) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) return line;
		const colon = trimmed.indexOf(":");
		if (colon === -1) return line;
		const key = trimmed.slice(0, colon).trim();
		if (!(key in updates)) return line;
		seen.add(key);
		const value = updates[key];
		if (value === undefined) return line;
		return `${key}: ${formatYamlValue(value)}`;
	});

	for (const [key, value] of Object.entries(updates)) {
		if (!seen.has(key)) {
			if (next.length > 0 && next[next.length - 1] !== "") {
				next.push("");
			}
			next.push(`${key}: ${formatYamlValue(value)}`);
		}
	}

	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, `${next.join("\n").replace(/\n+$/, "")}\n`, "utf8");
}

function formatYamlValue(value: string): string {
	if (
		value === "" ||
		/[:#\n]/.test(value) ||
		value.startsWith(" ") ||
		value.endsWith(" ")
	) {
		return JSON.stringify(value);
	}
	return value;
}
