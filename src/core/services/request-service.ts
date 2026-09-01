import type { RequestBody, RequestDocument } from "@core/domain";
import {
	addEndpointMethod,
	appendEndpointMethodData,
	deleteEndpointMethod,
	extractEndpointMethodData,
	parseEndpoint,
	renameEndpointMethod,
	updateEndpointMethod,
} from "@core/format";
import type { FsClient } from "./fs-client.js";
import { collectionsRoot, posixJoin, resolveEndpointPaths } from "./paths.js";

/** Recursively list endpoint paths relative to `collections/`. */
export function listEndpointPaths(fs: FsClient, cwd: string): string[] {
	const root = collectionsRoot(cwd);
	if (!fs.exists(root)) {
		return [];
	}

	const results: string[] = [];

	const walk = (dir: string, prefix = "") => {
		let hasYaml = false;
		for (const entry of fs.readDir(dir)) {
			if (entry.isFile && entry.name === "requests.yaml") {
				hasYaml = true;
			}
		}

		if (hasYaml && prefix) {
			results.push(prefix);
			return; // Don't traverse deeper if it's an endpoint
		}

		for (const entry of fs.readDir(dir)) {
			if (entry.isDirectory) {
				const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
				const abs = `${dir}/${entry.name}`;
				walk(abs, rel);
			}
		}
	};

	walk(root);
	return results.sort();
}

/** Resolves an arg like 'v2/echo/get' into the endpoint folder 'v2/echo' and method 'get' */
export function resolveEndpointAndMethod(
	fs: FsClient,
	arg: string,
	cwd: string,
) {
	const resolved = resolveEndpointPaths(arg, cwd);

	// If the absolute path is a directory containing requests.yaml, it's just the endpoint
	if (fs.exists(posixJoin(resolved.absPath, "requests.yaml"))) {
		return { endpointPath: resolved.absPath, methodId: undefined };
	}

	// Otherwise, it might be folder/method.
	const parent = resolved.absPath.slice(0, resolved.absPath.lastIndexOf("/"));
	const methodId = resolved.absPath.slice(
		resolved.absPath.lastIndexOf("/") + 1,
	);

	if (fs.exists(posixJoin(parent, "requests.yaml"))) {
		return { endpointPath: parent, methodId };
	}

	throw new Error(`Endpoint not found for: ${arg}`);
}

export function readEndpointRequests(
	fs: FsClient,
	arg: string,
	cwd: string,
): RequestDocument[] {
	const { endpointPath } = resolveEndpointAndMethod(fs, arg, cwd);
	const yamlSource = fs.readFile(posixJoin(endpointPath, "requests.yaml"));

	let docsSource: string | undefined;
	const docsPath = posixJoin(endpointPath, "docs.md");
	if (fs.exists(docsPath)) {
		docsSource = fs.readFile(docsPath);
	}

	const scripts: Record<string, string> = {};
	const scriptsDir = posixJoin(endpointPath, "scripts");
	if (fs.exists(scriptsDir)) {
		for (const entry of fs.readDir(scriptsDir)) {
			if (
				entry.isFile &&
				(entry.name.endsWith(".ts") || entry.name.endsWith(".js"))
			) {
				scripts[entry.name] = fs.readFile(posixJoin(scriptsDir, entry.name));
			}
		}
	}

	// The relative path to pass to parseEndpoint is just the folder name relative to collections
	const collectionsRootPath = collectionsRoot(cwd);
	let relPath = endpointPath.slice(collectionsRootPath.length);
	if (relPath.startsWith("/")) relPath = relPath.slice(1);

	return parseEndpoint(yamlSource, relPath, { docsSource, scripts });
}

export function readRequestSource(
	fs: FsClient,
	arg: string,
	cwd: string,
): RequestDocument {
	const { methodId } = resolveEndpointAndMethod(fs, arg, cwd);
	const docs = readEndpointRequests(fs, arg, cwd);

	if (!methodId) {
		throw new Error(`Expected a specific method request, got endpoint: ${arg}`);
	}

	const req = docs.find((d) => d.relativePath.endsWith(`/${methodId}`));
	if (!req) {
		throw new Error(`Method ${methodId} not found in endpoint`);
	}

	return req;
}

export function writeRequestSource(
	fs: FsClient,
	arg: string,
	updates: {
		url?: string;
		method?: string;
		body?: RequestBody;
		headers?: Record<string, string>;
	},
	cwd: string,
): {
	relativeToCollections: string;
	created: boolean;
} {
	const { endpointPath, methodId } = resolveEndpointAndMethod(fs, arg, cwd);
	if (!methodId) {
		throw new Error(`Expected a specific method request, got endpoint: ${arg}`);
	}

	const yamlPath = posixJoin(endpointPath, "requests.yaml");
	const yamlSource = fs.readFile(yamlPath);
	const updatedYaml = updateEndpointMethod(yamlSource, methodId, updates);
	fs.writeFile(yamlPath, updatedYaml);

	const collectionsRootPath = collectionsRoot(cwd);
	let relPath = endpointPath.slice(collectionsRootPath.length);
	if (relPath.startsWith("/")) relPath = relPath.slice(1);

	return {
		relativeToCollections: `${relPath}/${methodId}`,
		created: false,
	};
}

export function createRequestSource(
	fs: FsClient,
	arg: string, // e.g. "users/list/get"
	cwd: string,
): { relativeToCollections: string } {
	const resolved = resolveEndpointPaths(arg, cwd);
	const parent = resolved.absPath.slice(0, resolved.absPath.lastIndexOf("/"));
	const methodId = resolved.absPath.slice(
		resolved.absPath.lastIndexOf("/") + 1,
	);

	if (!methodId) {
		throw new Error(
			`Expected a specific method request to create, got: ${arg}`,
		);
	}

	const yamlPath = posixJoin(parent, "requests.yaml");
	let yamlSource = "";

	if (!fs.exists(parent)) {
		fs.mkdir(parent);
	}

	if (fs.exists(yamlPath)) {
		yamlSource = fs.readFile(yamlPath);
	}

	const updatedYaml = addEndpointMethod(yamlSource, methodId);
	fs.writeFile(yamlPath, updatedYaml);

	const collectionsRootPath = collectionsRoot(cwd);
	let relPath = parent.slice(collectionsRootPath.length);
	if (relPath.startsWith("/")) relPath = relPath.slice(1);

	return {
		relativeToCollections: `${relPath}/${methodId}`,
	};
}

export function deleteRequestFile(): void {
	throw new Error("Use deleteRequest() instead.");
}

/** Rename an endpoint folder (e.g. "v1/users" → "v1/members"). */
export function createFolder(
	fs: FsClient,
	folderPath: string,
	cwd: string,
): { newPath: string } {
	const root = collectionsRoot(cwd);
	const targetPath = posixJoin(root, folderPath);
	if (fs.exists(targetPath)) {
		throw new Error(`Folder already exists: ${folderPath}`);
	}
	fs.mkdir(targetPath);
	fs.writeFile(posixJoin(targetPath, "requests.yaml"), "methods:\n");
	return { newPath: folderPath };
}

export function renameFolder(
	fs: FsClient,
	folderPath: string, // relative to collections, e.g. "v1/users"
	newName: string, // just the new folder name, e.g. "members"
	cwd: string,
): { oldPath: string; newPath: string } {
	const collectionsRootPath = collectionsRoot(cwd);
	const absOld = posixJoin(collectionsRootPath, folderPath);
	const parent = absOld.slice(0, absOld.lastIndexOf("/"));
	const absNew = posixJoin(parent, newName);

	if (!fs.exists(absOld)) throw new Error(`Folder not found: ${folderPath}`);

	const newRelPath = absNew.slice(collectionsRootPath.length + 1);
	fs.renameDir(absOld, absNew);
	return { oldPath: folderPath, newPath: newRelPath };
}

/** Delete an endpoint folder and all its contents. */
export function deleteFolder(
	fs: FsClient,
	folderPath: string, // relative to collections, e.g. "v1/users"
	cwd: string,
): void {
	const collectionsRootPath = collectionsRoot(cwd);
	const absPath = posixJoin(collectionsRootPath, folderPath);
	if (!fs.exists(absPath)) throw new Error(`Folder not found: ${folderPath}`);
	fs.removeDir(absPath);
}

/** Rename a request's display name (updates `name` field in YAML). */
export function renameRequest(
	fs: FsClient,
	requestPath: string, // e.g. "v1/users/get"
	newName: string,
	cwd: string,
): void {
	const { endpointPath, methodId } = resolveEndpointAndMethod(
		fs,
		requestPath,
		cwd,
	);
	if (!methodId) throw new Error(`Expected a specific method: ${requestPath}`);

	const yamlPath = posixJoin(endpointPath, "requests.yaml");
	const yamlSource = fs.readFile(yamlPath);
	const updated = renameEndpointMethod(yamlSource, methodId, newName);
	fs.writeFile(yamlPath, updated);
}

/** Delete a request method entry from its YAML file. */
export function deleteRequest(
	fs: FsClient,
	requestPath: string, // e.g. "v1/users/get"
	cwd: string,
): void {
	const { endpointPath, methodId } = resolveEndpointAndMethod(
		fs,
		requestPath,
		cwd,
	);
	if (!methodId) throw new Error(`Expected a specific method: ${requestPath}`);

	const yamlPath = posixJoin(endpointPath, "requests.yaml");
	const yamlSource = fs.readFile(yamlPath);
	const updated = deleteEndpointMethod(yamlSource, methodId);
	fs.writeFile(yamlPath, updated);
}

/**
 * Move a request method from one endpoint folder to another.
 * e.g. move "v1/users/get" to folder "v1/members"
 */
export function moveRequest(
	fs: FsClient,
	requestPath: string, // e.g. "v1/users/get"
	toFolder: string, // e.g. "v1/members"
	cwd: string,
): { newPath: string } {
	const { endpointPath, methodId } = resolveEndpointAndMethod(
		fs,
		requestPath,
		cwd,
	);
	if (!methodId) throw new Error(`Expected a specific method: ${requestPath}`);

	const collectionsRootPath = collectionsRoot(cwd);
	const srcYamlPath = posixJoin(endpointPath, "requests.yaml");
	const srcYaml = fs.readFile(srcYamlPath);

	// Extract method data
	const data = extractEndpointMethodData(srcYaml, methodId);
	if (!data) throw new Error(`Method ${methodId} not found in ${requestPath}`);

	// Write to destination
	const destDir = posixJoin(collectionsRootPath, toFolder);
	if (!fs.exists(destDir)) fs.mkdir(destDir);
	const destYamlPath = posixJoin(destDir, "requests.yaml");
	const destYaml = fs.exists(destYamlPath) ? fs.readFile(destYamlPath) : "";
	const updatedDest = appendEndpointMethodData(destYaml, data);
	fs.writeFile(destYamlPath, updatedDest);

	// Remove from source
	const updatedSrc = deleteEndpointMethod(srcYaml, methodId);
	fs.writeFile(srcYamlPath, updatedSrc);

	let destRel = destDir.slice(collectionsRootPath.length);
	if (destRel.startsWith("/")) destRel = destRel.slice(1);

	return { newPath: `${destRel}/${methodId}` };
}

const PRE_SCRIPT_TEMPLATE = `import type { PreContext } from "dakiya/scripts";

export default async function ({ req, env, meta }: PreContext) {
	// Pre-request script runs before the HTTP request is dispatched.
	//
	// 1. Headers & Auth:
	// req.setHeader("Authorization", \`Bearer \${env.get("token")}\`);
	// req.setHeader("X-Request-Id", meta.traceId);
	//
	// 2. Request Body:
	// const body = req.body as Record<string, unknown>;
	// body.timestamp = Date.now();
	//
	// 3. Environment Variables:
	// const token = env.get("auth_token");
	// env.set("tempKey", "value"); // in-memory for this request run
	// env.set("auth_token", "new_token");
	// env.commit(); // permanently saves all modified variables to .json env file
}
`;

const POST_SCRIPT_TEMPLATE = `import type { PostContext } from "dakiya/scripts";

export default async function ({ req, res, env, meta }: PostContext) {
	// Post-request script runs after receiving the HTTP response.
	//
	// 1. Inspect Response:
	// const status = res.status; // e.g. 200
	// const data = res.json() as { token?: string; error?: string };
	//
	// 2. Save Variables (e.g. auth tokens from login):
	// if (status === 200 && data.token) {
	//   env.set("auth_token", data.token);
	//   env.commit(); // permanently saves all modified variables to .json env file
	// }
	//
	// 3. Logging & Performance:
	// console.log(\`[\${meta.requestName}] completed in \${meta.durationMs}ms with status \${res.status}\`);
}
`;

export function scaffoldScript(
	fs: FsClient,
	arg: string,
	type: "pre" | "post",
	cwd: string,
): { path: string } {
	const { endpointPath, methodId } = resolveEndpointAndMethod(fs, arg, cwd);
	if (!methodId) {
		throw new Error(`Expected a specific method request, got endpoint: ${arg}`);
	}

	const scriptsDir = posixJoin(endpointPath, "scripts");
	if (!fs.exists(scriptsDir)) {
		fs.mkdir(scriptsDir);
	}

	const tsPath = posixJoin(scriptsDir, `${methodId}.${type}.ts`);
	if (!fs.exists(tsPath)) {
		const template =
			type === "pre" ? PRE_SCRIPT_TEMPLATE : POST_SCRIPT_TEMPLATE;
		fs.writeFile(tsPath, template);
	}

	return { path: tsPath };
}

export function writeScript(
	fs: FsClient,
	arg: string,
	type: "pre" | "post",
	source: string,
	cwd: string,
) {
	const { endpointPath, methodId } = resolveEndpointAndMethod(fs, arg, cwd);
	if (!methodId) {
		throw new Error(`Expected a specific method request, got endpoint: ${arg}`);
	}

	const scriptsDir = posixJoin(endpointPath, "scripts");
	if (!fs.exists(scriptsDir)) {
		fs.mkdir(scriptsDir);
	}

	const tsPath = posixJoin(scriptsDir, `${methodId}.${type}.ts`);
	const jsPath = posixJoin(scriptsDir, `${methodId}.${type}.js`);

	// Prefer TS; fall back to JS if a .js file already exists (legacy workspace).
	if (fs.exists(jsPath)) {
		fs.writeFile(jsPath, source);
	} else {
		fs.writeFile(tsPath, source);
	}
}

export function deleteScript(
	fs: FsClient,
	arg: string,
	type: "pre" | "post",
	cwd: string,
) {
	const { endpointPath, methodId } = resolveEndpointAndMethod(fs, arg, cwd);
	if (!methodId) {
		throw new Error(`Expected a specific method request, got endpoint: ${arg}`);
	}

	const scriptsDir = posixJoin(endpointPath, "scripts");
	const tsPath = posixJoin(scriptsDir, `${methodId}.${type}.ts`);
	const jsPath = posixJoin(scriptsDir, `${methodId}.${type}.js`);

	if (fs.exists(tsPath)) {
		fs.removeFile(tsPath);
	}
	if (fs.exists(jsPath)) {
		fs.removeFile(jsPath);
	}
}
