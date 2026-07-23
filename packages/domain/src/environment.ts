/**
 * Environment profile — maps to `.dakiya/environments/<name>.yaml`.
 * Variables resolve as `{{name}}` in URL, headers, and body.
 */

export type EnvironmentVariables = Record<string, string>;

export type Environment = {
	/** File stem, e.g. `local` for `environments/local.yaml`. */
	name: string;
	/** Key-value vars available to requests and scripts. */
	variables: EnvironmentVariables;
};
