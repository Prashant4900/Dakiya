import type { Environment, EnvironmentVariables } from "@dakiya/domain";
import { parseSimpleYaml } from "./yaml.js";

/** Parse an environments/<name>.yaml file into an Environment. */
export function parseEnvironment(name: string, source: string): Environment {
	const raw = parseSimpleYaml(source);
	const variables: EnvironmentVariables = {};
	for (const [k, v] of Object.entries(raw)) {
		if (typeof v === "string") variables[k] = v;
	}
	return { name, variables };
}
