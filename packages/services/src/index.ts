/**
 * Layer 3 — workspace / env / send orchestration.
 * No Node/React imports; callers inject fs + optional HttpClient / ScriptRunner.
 */

export type { CollectionNode } from "./collection-tree.js";
export { buildCollectionTree } from "./collection-tree.js";
export { parseEnvironment } from "./environment.js";
export {
	loadActiveEnvironment,
	loadEnvironment,
	readEnvironmentSource,
	writeEnvironmentSource,
} from "./environment-service.js";
export type { FsClient, FsDirEntry } from "./fs-client.js";
export type { HttpClient } from "./http.js";
export { createFetchHttpClient } from "./http.js";
export { createMemoryFs } from "./memory-fs.js";
export {
	COLLECTIONS_DIR,
	collectionsRoot,
	DAKIYA_DIR,
	dakiyaRoot,
	ENVIRONMENTS_DIR,
	environmentPath,
	environmentsRoot,
	MANIFEST_FILE,
	manifestPath,
	normalizeRequestPath,
	resolveRequestPaths,
} from "./paths.js";
export type { SendRequestOptions, SendRequestResult } from "./request.js";
export { sendRequest } from "./request.js";
export {
	deleteRequestFile,
	listRequestPaths,
	readRequestSource,
	writeRequestSource,
} from "./request-service.js";
export { resolveRequest } from "./resolve.js";
export type { ScaffoldFile, ScaffoldResult } from "./scaffold.js";
export {
	buildLocalEnvContent,
	buildManifestContent,
	scaffoldFiles,
} from "./scaffold.js";
export type {
	MutableRequest,
	MutableResponse,
	RunScriptInput,
	RunScriptResult,
	ScriptPhase,
	ScriptRunner,
} from "./script.js";
export { toMutableRequest, toMutableResponse } from "./script.js";
export { resolveRecord, resolveVars } from "./vars.js";
export { parseWorkspaceManifest } from "./workspace.js";
export {
	hasManifest,
	hasWorkspace,
	loadManifest,
	scaffoldWorkspace,
} from "./workspace-service.js";
export { parseSimpleYaml } from "./yaml.js";

import { hello as domainHello } from "@dakiya/domain";

/** Skeleton hello — kept for `dakiya hello`. */
export function greet(): string {
	const domain = domainHello();
	return ["Hello from @dakiya/services", `  ← ${domain.message}`].join("\n");
}
