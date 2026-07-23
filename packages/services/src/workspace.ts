import type { WorkspaceManifest } from "@dakiya/domain";
import { parseSimpleYaml } from "./yaml.js";

/** Parse `.dakiya/dakiya.yaml` text into a workspace manifest. */
export function parseWorkspaceManifest(source: string): WorkspaceManifest {
	const raw = parseSimpleYaml(source);
	const name = raw.name?.trim();
	if (!name) {
		throw new Error("dakiya.yaml: missing required field `name`");
	}

	const versionRaw = raw.version?.trim() ?? "1";
	const version = Number(versionRaw);
	if (!Number.isFinite(version)) {
		throw new Error(`dakiya.yaml: invalid version: ${versionRaw}`);
	}

	return {
		name,
		version,
		...(raw.description !== undefined ? { description: raw.description } : {}),
		...(raw.defaultEnv !== undefined && raw.defaultEnv !== ""
			? { defaultEnv: raw.defaultEnv }
			: {}),
	};
}
