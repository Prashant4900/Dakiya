import type { RequestDocument } from "@dakiya/domain";
import { parseEndpoint } from "@dakiya/format";
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

export function writeRequestSource(): {
	relativeToCollections: string;
	created: boolean;
} {
	throw new Error(
		"Writing is not supported with requests.yaml multi-file structure yet.",
	);
}

export function deleteRequestFile(): void {
	throw new Error(
		"Deleting is not supported with requests.yaml multi-file structure yet.",
	);
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
