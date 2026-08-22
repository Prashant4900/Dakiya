import { parseEnvironment, sendRequest } from "@dakiya/services";
import { Hono } from "hono";
import { readFile } from "fs/promises";
import { join } from "path";
import { persistEnvironmentVariables } from "../sandbox/persist-env.js";
import { createVmScriptRunner } from "../sandbox/run-script.js";
import { createFetchHttpClient } from "@dakiya/services";
import {
	buildCollectionTree,
	listEndpointPaths,
	listEnvironmentNames,
	loadEnvironment,
	loadManifest,
	readEndpointRequests,
	readEnvironmentSource,
	readRequestSource,
	writeEnvironmentSource,
} from "../workspace.js";

export type ApiOptions = {
	cwd?: string;
};

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

function isNotFound(message: string): boolean {
	return message.includes("not found") || message.includes("No workspace");
}

/** Local HTTP API for the dashboard — mounted under `/api`. */
export function createApiApp(options: ApiOptions = {}): Hono {
	const cwd = options.cwd ?? process.cwd();
	const app = new Hono();

	app.get("/health", (c) => c.json({ status: "ok" }));

	app.post("/upload", async (c) => {
		try {
			const body = await c.req.parseBody();
			const file = body["file"] as File;
			if (!file) {
				return c.json({ error: "No file provided" }, 400);
			}

			const filesDir = join(cwd, ".dakiya", "files");
			const { mkdir, writeFile } = await import("fs/promises");
			await mkdir(filesDir, { recursive: true });

			const fileName = `${Date.now()}-${file.name}`;
			const filePath = join(filesDir, fileName);
			
			const arrayBuffer = await file.arrayBuffer();
			await writeFile(filePath, Buffer.from(arrayBuffer));

			return c.json({ path: `.dakiya/files/${fileName}` });
		} catch (err) {
			return c.json({ error: errorMessage(err) }, 500);
		}
	});

	app.get("/workspace", (c) => {
		try {
			const manifest = loadManifest(cwd);
			const endpoints = listEndpointPaths(cwd);

			const requestPaths: string[] = [];
			const requestIndex: Record<string, unknown>[] = [];

			for (const endpoint of endpoints) {
				try {
					const docs = readEndpointRequests(endpoint, cwd);
					for (const doc of docs) {
						requestPaths.push(doc.relativePath);
						requestIndex.push({
							path: doc.relativePath,
							name: doc.meta.name,
							method: doc.request.method,
						});
					}
				} catch (err) {
					console.error("Failed to parse endpoint", endpoint, err);
				}
			}

			return c.json({
				manifest,
				requests: requestPaths,
				requestIndex,
				tree: buildCollectionTree(requestPaths),
				environments: listEnvironmentNames(cwd),
				cwd,
			});
		} catch (err) {
			return c.json({ error: errorMessage(err) }, 500);
		}
	});

	app.get("/requests/*", (c) => {
		const pathParam = c.req.path.replace(/^\/requests\//, "");
		try {
			const document = readRequestSource(pathParam, cwd);
			return c.json({
				path: document.relativePath,
				relativePath: `collections/${document.relativePath}`,
				source: "", // No longer a single source file to return
				document,
			});
		} catch (err) {
			const message = errorMessage(err);
			return c.json({ error: message }, isNotFound(message) ? 404 : 400);
		}
	});

	app.put("/requests/*", async (c) => {
		const fullPath = c.req.path.replace(/^\/requests\//, "");
		if (
			fullPath.endsWith("/scripts/pre") ||
			fullPath.endsWith("/scripts/post")
		) {
			try {
				const type = fullPath.endsWith("/scripts/pre") ? "pre" : "post";
				const reqPath = fullPath.replace(/\/scripts\/(pre|post)$/, "");
				const body = await c.req.json();
				const { writeScript } = await import("../workspace.js");
				writeScript(reqPath, type, body.source, cwd);
				return c.json({ success: true });
			} catch (err) {
				return c.json({ error: errorMessage(err) }, 400);
			}
		}

		try {
			const body = await c.req.json();
			const { writeRequestSource } = await import("../workspace.js");
			const result = writeRequestSource(fullPath, body, cwd);
			return c.json({ success: true, relativeToCollections: result.relativeToCollections });
		} catch (err) {
			return c.json({ error: errorMessage(err) }, 400);
		}
	});

	app.post("/requests/*", async (c) => {
		return c.json(
			{
				error:
					"Writing requests is not supported in the YAML folder format yet.",
			},
			400,
		);
	});

	app.delete("/requests/*", async (c) => {
		const fullPath = c.req.path.replace(/^\/requests\//, "");
		if (
			fullPath.endsWith("/scripts/pre") ||
			fullPath.endsWith("/scripts/post")
		) {
			try {
				const type = fullPath.endsWith("/scripts/pre") ? "pre" : "post";
				const reqPath = fullPath.replace(/\/scripts\/(pre|post)$/, "");
				const { deleteScript } = await import("../workspace.js");
				deleteScript(reqPath, type, cwd);
				return c.json({ success: true });
			} catch (err) {
				return c.json({ error: errorMessage(err) }, 400);
			}
		}
		return c.json(
			{
				error:
					"Deleting requests is not supported in the YAML folder format yet.",
			},
			400,
		);
	});

	app.get("/environments/:name", (c) => {
		const name = c.req.param("name");
		try {
			const source = readEnvironmentSource(name, cwd);
			const environment = parseEnvironment(name, source);
			return c.json({ name, source, environment });
		} catch (err) {
			const message = errorMessage(err);
			return c.json({ error: message }, isNotFound(message) ? 404 : 400);
		}
	});

	app.put("/environments/:name", async (c) => {
		const name = c.req.param("name");
		try {
			const source = await c.req.text();
			if (!source.trim()) {
				return c.json({ error: "Environment YAML body is required" }, 400);
			}
			parseEnvironment(name, source);
			writeEnvironmentSource(name, source, cwd);
			return c.json({ ok: true, name });
		} catch (err) {
			return c.json({ error: errorMessage(err) }, 400);
		}
	});

	app.post("/send", async (c) => {
		try {
			const body = await c.req.json<{ path?: string; env?: string }>();
			if (!body.path || typeof body.path !== "string") {
				return c.json({ error: "Body must include string `path`" }, 400);
			}

			const manifest = loadManifest(cwd);
			const envName = body.env ?? manifest.defaultEnv ?? "local";
			const environment = loadEnvironment(envName, cwd);
			const document = readRequestSource(body.path, cwd);

			const result = await sendRequest({
				document,
				variables: environment.variables,
				scripts: createVmScriptRunner(),
				http: createFetchHttpClient({
					readFileAsBlob: async (filePath: string) => {
						// Resolve path relative to the workspace (.dakiya/files for instance, or just cwd)
						const absPath = join(cwd, filePath);
						const buffer = await readFile(absPath);
						return new Blob([buffer]);
					}
				})
			});

			if (Object.keys(result.persistedVariables).length > 0) {
				persistEnvironmentVariables(envName, result.persistedVariables, cwd);
			}

			return c.json({
				path: document.relativePath,
				env: envName,
				resolved: result.resolved,
				response: result.response,
				variables: result.variables,
				persistedVariables: result.persistedVariables,
				logs: result.logs,
			});
		} catch (err) {
			const message = errorMessage(err);
			return c.json({ error: message }, isNotFound(message) ? 404 : 400);
		}
	});

	return app;
}
