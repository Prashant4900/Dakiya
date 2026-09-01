import type { Environment, EnvironmentVariables } from "@core/domain";

/** Parse an environments/<name>.json file into an Environment. */
export function parseEnvironment(name: string, source: string): Environment {
	const raw = source.trim() ? JSON.parse(source) : {};
	const variables: EnvironmentVariables = {};
	for (const [k, v] of Object.entries(raw)) {
		if (typeof v === "string") variables[k] = v;
	}
	return { name, variables };
}
