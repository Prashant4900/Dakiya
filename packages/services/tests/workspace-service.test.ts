import { describe, expect, it } from "vitest";
import { loadEnvironment } from "../src/environment-service.js";
import { createMemoryFs } from "../src/memory-fs.js";
import { dakiyaRoot } from "../src/paths.js";
import { loadManifest, scaffoldWorkspace } from "../src/workspace-service.js";

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


