export type ScaffoldFile = {
	relativePath: string;
	content: string;
};

export type ScaffoldResult = {
	created: string[];
	skipped: string[];
};

/** Default workspace core manifest written to `.dakiya/dakiya.yaml`. */
export function buildManifestContent(workspaceName: string): string {
	return [
		`# Dakiya workspace core — metadata for this project`,
		`name: ${workspaceName}`,
		`description: "A local-first API workspace for ${workspaceName}."`,
		``,
		`versions:`,
		`  - v1`,
		``,
		`# Active environment (matches a file under environments/)`,
		`defaultEnv: local`,
		``,
	].join("\n");
}

export function buildLocalEnvContent(): string {
	return [
		`# Local environment variables — use as {{name}} in requests`,
		`baseUrl: http://localhost:3000`,
		``,
	].join("\n");
}

/** Production-clean files for a fresh `.dakiya/` workspace (no sample requests). */
export function scaffoldFiles(workspaceName: string): ScaffoldFile[] {
	return [
		{
			relativePath: "dakiya.yaml",
			content: buildManifestContent(workspaceName),
		},
		{
			relativePath: "environments/local.yaml",
			content: buildLocalEnvContent(),
		},
	];
}
