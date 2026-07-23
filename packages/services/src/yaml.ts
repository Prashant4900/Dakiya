/**
 * Minimal single-level YAML for dakiya.yaml and environments/*.yaml.
 * Supports comments, bare values, and simple double/single quotes.
 * Not a full YAML parser — enough for flat key-value workspaces.
 */

export function parseSimpleYaml(source: string): Record<string, string> {
	const out: Record<string, string> = {};

	for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
		const line = raw.trim();
		if (!line || line.startsWith("#")) continue;

		const colon = line.indexOf(":");
		if (colon === -1) {
			throw new Error(`Invalid YAML line (expected key: value): ${line}`);
		}

		const key = line.slice(0, colon).trim();
		let value = line.slice(colon + 1).trim();
		if (!key) {
			throw new Error(`Invalid YAML key: ${line}`);
		}

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		out[key] = value;
	}

	return out;
}
