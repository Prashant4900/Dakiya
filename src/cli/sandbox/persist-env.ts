import * as fs from "node:fs";
import * as path from "node:path";
import type { EnvironmentVariables } from "@core/domain";
import { dakiyaDir } from "../workspace.js";

/**
 * Merge persisted script vars into environments/<name>.json.
 */
export function persistEnvironmentVariables(
	envName: string,
	updates: EnvironmentVariables,
	cwd = process.cwd(),
): void {
	if (Object.keys(updates).length === 0) return;

	const file = path.join(dakiyaDir(cwd), "environments", `${envName}.json`);
	
	let current: Record<string, string> = {};
	if (fs.existsSync(file)) {
		try {
			const text = fs.readFileSync(file, "utf8").trim();
			if (text) {
				current = JSON.parse(text);
			}
		} catch (err) {
			console.error(`[dakiya] Error reading ${envName}.json:`, err);
		}
	}

	for (const [key, value] of Object.entries(updates)) {
		current[key] = value;
	}

	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify(current, null, 2) + "\n", "utf8");
}
