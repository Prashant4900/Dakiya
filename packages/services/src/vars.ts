import type { EnvironmentVariables } from "@dakiya/domain";

const VAR_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Replace `{{name}}` placeholders. Missing keys are left unchanged
 * so callers can spot unresolved vars in the URL/body.
 */
export function resolveVars(
	template: string,
	variables: EnvironmentVariables,
): string {
	return template.replace(VAR_PATTERN, (match, name: string) => {
		if (Object.hasOwn(variables, name)) {
			return variables[name]!;
		}
		return match;
	});
}

export function resolveRecord(
	record: Record<string, string>,
	variables: EnvironmentVariables,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(record)) {
		out[resolveVars(key, variables)] = resolveVars(value, variables);
	}
	return out;
}
