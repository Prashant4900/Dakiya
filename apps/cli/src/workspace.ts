import {
	buildCollectionTree,
	collectionsRoot,
	createFolder as createFolderService,
	createRequestSource as createRequestSourceService,
	dakiyaRoot,
	deleteFolder as deleteFolderService,
	deleteRequestFile as deleteRequestFileService,
	deleteRequest as deleteRequestService,
	deleteScript as deleteScriptService,
	environmentsRoot,
	hasManifest,
	hasWorkspace,
	listEndpointPaths as listEndpointPathsService,
	listEnvironmentNames as listEnvironmentNamesService,
	loadActiveEnvironment as loadActiveEnvironmentService,
	loadEnvironment as loadEnvironmentService,
	loadManifest as loadManifestService,
	moveRequest as moveRequestService,
	normalizeEndpointPath,
	readEndpointRequests as readEndpointRequestsService,
	readEnvironmentSource as readEnvironmentSourceService,
	readRequestSource as readRequestSourceService,
	renameFolder as renameFolderService,
	renameRequest as renameRequestService,
	resolveEndpointPaths,
	writeEnvironmentSource as writeEnvironmentSourceService,
	writeRequestSource as writeRequestSourceService,
	writeScript as writeScriptService,
} from "@dakiya/services";
import { createNodeFsClient } from "./fs/node-fs-client.js";

const fs = createNodeFsClient();

export { buildCollectionTree, normalizeEndpointPath };
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

export function listEndpointPaths(cwd = process.cwd()) {
	return listEndpointPathsService(fs, cwd);
}

export function listEnvironmentNames(cwd = process.cwd()) {
	return listEnvironmentNamesService(fs, cwd);
}

export function resolveEndpointFile(arg: string, cwd = process.cwd()) {
	return resolveEndpointPaths(arg, cwd);
}

export function readEndpointRequests(arg: string, cwd = process.cwd()) {
	return readEndpointRequestsService(fs, arg, cwd);
}

export function readRequestSource(arg: string, cwd = process.cwd()) {
	return readRequestSourceService(fs, arg, cwd);
}

export function writeRequestSource(
	arg: string,
	updates: Record<string, unknown>,
	cwd = process.cwd(),
) {
	return writeRequestSourceService(fs, arg, updates, cwd);
}

export function createRequestSource(arg: string, cwd = process.cwd()) {
	return createRequestSourceService(fs, arg, cwd);
}

export function deleteRequestFile() {
	return deleteRequestFileService();
}

export function writeScript(
	arg: string,
	type: "pre" | "post",
	source: string,
	cwd = process.cwd(),
) {
	return writeScriptService(fs, arg, type, source, cwd);
}

export function deleteScript(
	arg: string,
	type: "pre" | "post",
	cwd = process.cwd(),
) {
	return deleteScriptService(fs, arg, type, cwd);
}

export function renameFolder(
	folderPath: string,
	newName: string,
	cwd = process.cwd(),
) {
	return renameFolderService(fs, folderPath, newName, cwd);
}

export function createFolder(folderPath: string, cwd = process.cwd()) {
	return createFolderService(fs, folderPath, cwd);
}

export function deleteFolder(folderPath: string, cwd = process.cwd()) {
	return deleteFolderService(fs, folderPath, cwd);
}

export function renameRequest(
	requestPath: string,
	newName: string,
	cwd = process.cwd(),
) {
	return renameRequestService(fs, requestPath, newName, cwd);
}

export function deleteRequest(requestPath: string, cwd = process.cwd()) {
	return deleteRequestService(fs, requestPath, cwd);
}

export function moveRequest(
	requestPath: string,
	toFolder: string,
	cwd = process.cwd(),
) {
	return moveRequestService(fs, requestPath, toFolder, cwd);
}
