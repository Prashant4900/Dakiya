import {
	buildCollectionTree,
	collectionsRoot,
	dakiyaRoot,
	deleteRequestFile as deleteRequestFileService,
	environmentsRoot,
	hasManifest,
	hasWorkspace,
	listEnvironmentNames as listEnvironmentNamesService,
	listRequestPaths as listRequestPathsService,
	loadActiveEnvironment as loadActiveEnvironmentService,
	loadEnvironment as loadEnvironmentService,
	loadManifest as loadManifestService,
	normalizeRequestPath,
	readEnvironmentSource as readEnvironmentSourceService,
	readRequestSource as readRequestSourceService,
	resolveRequestPaths,
	writeEnvironmentSource as writeEnvironmentSourceService,
	writeRequestSource as writeRequestSourceService,
} from "@dakiya/services";
import { createNodeFsClient } from "./fs/node-fs-client.js";

const fs = createNodeFsClient();

export { buildCollectionTree, normalizeRequestPath };
export type CollectionNode =
	| { name: string; type: "folder"; children: CollectionNode[] }
	| { name: string; type: "request"; path: string };

export function dakiyaDir(cwd = process.cwd()): string {
	return dakiyaRoot(cwd);
}

export function collectionsDir(cwd = process.cwd()): string {
	return collectionsRoot(cwd);
}

export function environmentsDir(cwd = process.cwd()): string {
	return environmentsRoot(cwd);
}

export function hasDakiyaWorkspace(cwd = process.cwd()): boolean {
	return hasWorkspace(fs, cwd);
}

export function hasDakiyaManifest(cwd = process.cwd()): boolean {
	return hasManifest(fs, cwd);
}

/** Require a usable `.dakiya/` + `dakiya.yaml`; exit with message if missing. */
export function requireWorkspace(cwd = process.cwd()): string {
	if (!hasDakiyaWorkspace(cwd) || !hasDakiyaManifest(cwd)) {
		console.error(`[dakiya] No workspace found in ${cwd}`);
		console.error(`[dakiya] Run \`dakiya init\` first.`);
		process.exit(1);
	}
	return dakiyaDir(cwd);
}

export function loadManifest(cwd = process.cwd()) {
	return loadManifestService(fs, cwd);
}

export function loadActiveEnvironment(cwd = process.cwd()) {
	return loadActiveEnvironmentService(fs, cwd);
}

export function loadEnvironment(envName: string, cwd = process.cwd()) {
	return loadEnvironmentService(fs, envName, cwd);
}

export function readEnvironmentSource(envName: string, cwd = process.cwd()) {
	return readEnvironmentSourceService(fs, envName, cwd);
}

export function writeEnvironmentSource(
	envName: string,
	source: string,
	cwd = process.cwd(),
) {
	return writeEnvironmentSourceService(fs, envName, source, cwd);
}

export function listRequestPaths(cwd = process.cwd()) {
	return listRequestPathsService(fs, cwd);
}

export function listEnvironmentNames(cwd = process.cwd()) {
	return listEnvironmentNamesService(fs, cwd);
}

export function resolveRequestFile(arg: string, cwd = process.cwd()) {
	return resolveRequestPaths(arg, cwd);
}

export function readRequestSource(arg: string, cwd = process.cwd()) {
	return readRequestSourceService(fs, arg, cwd);
}

export function writeRequestSource(
	arg: string,
	source: string,
	cwd = process.cwd(),
	options?: { createOnly?: boolean },
) {
	return writeRequestSourceService(fs, arg, source, cwd, options);
}

export function deleteRequestFile(arg: string, cwd = process.cwd()) {
	return deleteRequestFileService(fs, arg, cwd);
}
