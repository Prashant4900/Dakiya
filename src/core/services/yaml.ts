import { parse } from "yaml";

/**
 * Minimal YAML parser wrapper for dakiya.yaml.
 */
export function parseSimpleYaml(
	source: string,
): Record<string, string | string[]> {
	const parsed = parse(source);
	return parsed || {};
}
