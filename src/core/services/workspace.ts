import type { WorkspaceManifest } from "@core/domain";
import { parseSimpleYaml } from "./yaml.js";

/** Parse `.dakiya/dakiya.yaml` text into a workspace manifest. */
export function parseWorkspaceManifest(source: string): WorkspaceManifest {
	const raw = parseSimpleYaml(source);
	const name = typeof raw.name === "string" ? raw.name.trim() : "";
	if (!name) {
		throw new Error("dakiya.yaml: missing required field `name`");
	}

	const versions = Array.isArray(raw.versions) ? raw.versions : undefined;
	const defaultVersionName =
		typeof raw.defaultVersionName === "string"
			? raw.defaultVersionName.trim()
			: "default";
	const description =
		typeof raw.description === "string" ? raw.description : undefined;
	const defaultEnv =
		typeof raw.defaultEnv === "string" ? raw.defaultEnv : undefined;

	return {
		name,
		versions,
		defaultVersionName,
		...(description !== undefined ? { description } : {}),
		...(defaultEnv !== undefined && defaultEnv !== "" ? { defaultEnv } : {}),
	};
}
