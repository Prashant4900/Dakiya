import type { Environment, EnvironmentVariables } from "@dakiya/domain";
import { parseSimpleYaml } from "./yaml.js";

/** Parse an environments/<name>.yaml file into an Environment. */
export function parseEnvironment(name: string, source: string): Environment {
	const variables: EnvironmentVariables = parseSimpleYaml(source);
	return { name, variables };
}
