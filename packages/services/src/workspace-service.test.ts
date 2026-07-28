import { describe, expect, it } from "vitest";
import { loadEnvironment } from "./environment-service.js";
import { createMemoryFs } from "./memory-fs.js";
import { dakiyaRoot } from "./paths.js";
import {
	listRequestPaths,
	readRequestSource,
	writeRequestSource,
} from "./request-service.js";
import { loadManifest, scaffoldWorkspace } from "./workspace-service.js";

describe("scaffoldWorkspace", () => {
	it("creates manifest and local env", () => {
		const fs = createMemoryFs();
		const cwd = "/project";
		const result = scaffoldWorkspace(fs, cwd, "my-api");

		expect(result.created).toContain("dakiya.yaml");
		expect(result.created).toContain("environments/local.yaml");
		expect(fs.exists(dakiyaRoot(cwd))).toBe(true);

		const manifest = loadManifest(fs, cwd);
		expect(manifest.name).toBe("my-api");
		expect(manifest.defaultEnv).toBe("local");

		const env = loadEnvironment(fs, "local", cwd);
		expect(env.variables.baseUrl).toBe("http://localhost:3000");
	});

	it("is idempotent for existing files", () => {
		const fs = createMemoryFs();
		const cwd = "/project";
		scaffoldWorkspace(fs, cwd, "my-api");
		const second = scaffoldWorkspace(fs, cwd, "my-api");
		expect(second.skipped).toContain("dakiya.yaml");
	});
});

describe("request service", () => {
	it("lists, reads, and writes requests", () => {
		const fs = createMemoryFs();
		const cwd = "/project";
		scaffoldWorkspace(fs, cwd, "demo");

		writeRequestSource(
			fs,
			"health/health",
			`@meta
name: Health
type: http

@request
GET {{baseUrl}}/health
`,
			cwd,
			{ createOnly: true },
		);

		expect(listRequestPaths(fs, cwd)).toEqual(["health/health.drq"]);

		const { source, relativeToCollections } = readRequestSource(
			fs,
			"health/health",
			cwd,
		);
		expect(relativeToCollections).toBe("health/health.drq");
		expect(source).toContain("name: Health");
	});
});
