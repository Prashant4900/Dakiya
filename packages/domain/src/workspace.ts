/**
 * On-disk workspace core — maps to `.dakiya/dakiya.yaml`.
 * Zod schemas land later in Phase 1; these types are the contract now.
 */

/** Manifest schema version currently written by `dakiya init`. */
export const WORKSPACE_MANIFEST_VERSION = 1 as const;

export type WorkspaceManifest = {
	/** Display name of the workspace. */
	name: string;
	/** Short purpose / notes. */
	description?: string;
	/** Manifest schema version. */
	version: number;
	/** Active environment key (file stem under `environments/`). */
	defaultEnv?: string;
};
