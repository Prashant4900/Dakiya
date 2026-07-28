import { parseDrq } from "@dakiya/format";
import { parseEnvironment, sendRequest } from "@dakiya/services";
import { Hono } from "hono";
import { persistEnvironmentVariables } from "../sandbox/persist-env.js";
import { createVmScriptRunner } from "../sandbox/run-script.js";
import {
	buildCollectionTree,
	deleteRequestFile,
	listEnvironmentNames,
	listRequestPaths,
	loadEnvironment,
	loadManifest,
	readEnvironmentSource,
	readRequestSource,
	writeEnvironmentSource,
	writeRequestSource,
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

function isConflict(message: string): boolean {
	return message.includes("already exists");
}

/** Local HTTP API for the dashboard — mounted under `/api`. */
export function createApiApp(options: ApiOptions = {}): Hono {
	const cwd = options.cwd ?? process.cwd();
	const app = new Hono();

	app.get("/health", (c) => c.json({ status: "ok" }));

	app.get("/workspace", (c) => {
		try {
			const manifest = loadManifest(cwd);
			const requests = listRequestPaths(cwd);
			const requestIndex = requests.map((path) => {
				try {
					const { source, relativeToDakiya } = readRequestSource(path, cwd);
					const document = parseDrq(source, relativeToDakiya);
					return {
						path,
						name: document.meta.name,
						method: document.request.method,
					};
				} catch {
					return { path, name: path, method: "GET" };
				}
			});
			return c.json({
				manifest,
				requests,
				requestIndex,
				tree: buildCollectionTree(requests),
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
			const { source, relativeToDakiya, relativeToCollections } =
				readRequestSource(pathParam, cwd);
			const document = parseDrq(source, relativeToDakiya);
			return c.json({
				path: relativeToCollections,
				relativePath: relativeToDakiya,
				source,
				document,
			});
		} catch (err) {
			const message = errorMessage(err);
			return c.json({ error: message }, isNotFound(message) ? 404 : 400);
		}
	});

	app.put("/requests/*", async (c) => {
		const pathParam = c.req.path.replace(/^\/requests\//, "");
		try {
			const source = await c.req.text();
			if (!source.trim()) {
				return c.json({ error: "Request body (raw .drq) is required" }, 400);
			}
			// Validate parse before write.
			parseDrq(source, `collections/${pathParam}`);
			const result = writeRequestSource(pathParam, source, cwd);
			return c.json({
				ok: true,
				path: result.relativeToCollections,
				created: result.created,
			});
		} catch (err) {
			const message = errorMessage(err);
			return c.json({ error: message }, isNotFound(message) ? 404 : 400);
		}
	});

	app.post("/requests/*", async (c) => {
		const pathParam = c.req.path.replace(/^\/requests\//, "");
		try {
			const source = await c.req.text();
			if (!source.trim()) {
				return c.json({ error: "Request body (raw .drq) is required" }, 400);
			}
			parseDrq(source, `collections/${pathParam}`);
			const result = writeRequestSource(pathParam, source, cwd, {
				createOnly: true,
			});
			return c.json(
				{
					ok: true,
					path: result.relativeToCollections,
					created: result.created,
				},
				201,
			);
		} catch (err) {
			const message = errorMessage(err);
			const status = isConflict(message)
				? 409
				: isNotFound(message)
					? 404
					: 400;
			return c.json({ error: message }, status);
		}
	});

	app.delete("/requests/*", (c) => {
		const pathParam = c.req.path.replace(/^\/requests\//, "");
		try {
			deleteRequestFile(pathParam, cwd);
			return c.json({ ok: true });
		} catch (err) {
			const message = errorMessage(err);
			return c.json({ error: message }, isNotFound(message) ? 404 : 400);
		}
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
			const { source, relativeToDakiya, relativeToCollections } =
				readRequestSource(body.path, cwd);
			const document = parseDrq(source, relativeToDakiya);

			const result = await sendRequest({
				document,
				variables: environment.variables,
				scripts: createVmScriptRunner(),
			});

			if (Object.keys(result.persistedVariables).length > 0) {
				persistEnvironmentVariables(envName, result.persistedVariables, cwd);
			}

			return c.json({
				path: relativeToCollections,
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
