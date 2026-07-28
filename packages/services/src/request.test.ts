import type { RequestDocument, ScriptBlock } from "@dakiya/domain";
import { describe, expect, it } from "vitest";
import type { HttpClient } from "./http.js";
import { sendRequest } from "./request.js";
import { resolveRequest } from "./resolve.js";
import type { ScriptRunner } from "./script.js";
import { resolveRecord, resolveVars } from "./vars.js";

describe("resolveVars", () => {
	it("substitutes known variables", () => {
		expect(
			resolveVars("{{baseUrl}}/users", { baseUrl: "http://localhost" }),
		).toBe("http://localhost/users");
	});

	it("leaves unknown placeholders unchanged", () => {
		expect(resolveVars("{{missing}}", {})).toBe("{{missing}}");
	});
});

describe("resolveRecord", () => {
	it("resolves keys and values", () => {
		expect(
			resolveRecord({ Authorization: "Bearer {{token}}" }, { token: "abc" }),
		).toEqual({ Authorization: "Bearer abc" });
	});
});

describe("resolveRequest", () => {
	it("applies variables to request fields", () => {
		const doc: RequestDocument = {
			relativePath: "collections/x.drq",
			meta: { name: "X", type: "http" },
			request: {
				method: "GET",
				url: "{{baseUrl}}/api",
				headers: { "X-Env": "{{env}}" },
			},
			body: '{"id":"{{id}}"}',
		};

		expect(
			resolveRequest(doc, {
				baseUrl: "http://localhost",
				env: "local",
				id: "1",
			}),
		).toEqual({
			method: "GET",
			url: "http://localhost/api",
			headers: { "X-Env": "local" },
			body: '{"id":"1"}',
		});
	});
});

describe("sendRequest", () => {
	const baseDoc: RequestDocument = {
		relativePath: "collections/x.drq",
		meta: { name: "X", type: "http" },
		request: {
			method: "GET",
			url: "{{baseUrl}}/ok",
			headers: {},
		},
	};

	it("runs pre, http, and post in order", async () => {
		const events: string[] = [];
		const http: HttpClient = {
			async send(req) {
				events.push(`http:${req.url}`);
				return {
					status: 200,
					statusText: "OK",
					headers: { "content-type": "application/json" },
					body: '{"ok":true}',
					durationMs: 5,
				};
			},
		};

		const scripts: ScriptRunner = async (input) => {
			events.push(input.phase);
			if (input.phase === "pre") {
				input.request.url = input.request.url.replace("/ok", "/pre");
			}
			if (input.phase === "post" && input.response) {
				input.response.status = 201;
			}
			return { logs: [`${input.phase}-log`], persistedKeys: [] };
		};

		const result = await sendRequest({
			document: {
				...baseDoc,
				pre: { lang: "js", source: "// pre" } satisfies ScriptBlock,
				post: { lang: "js", source: "// post" } satisfies ScriptBlock,
			},
			variables: { baseUrl: "http://localhost" },
			http,
			scripts,
		});

		expect(events).toEqual(["pre", "http:http://localhost/pre", "post"]);
		expect(result.response.status).toBe(201);
		expect(result.logs).toEqual(["pre-log", "post-log"]);
	});

	it("tracks persisted env keys from scripts", async () => {
		const scripts: ScriptRunner = async (input) => {
			if (input.phase === "post") {
				input.variables.token = "secret";
				return { logs: [], persistedKeys: ["token"] };
			}
			return { logs: [], persistedKeys: [] };
		};

		const result = await sendRequest({
			document: {
				...baseDoc,
				post: { lang: "js", source: "// post" },
			},
			variables: { baseUrl: "http://localhost" },
			http: {
				async send() {
					return {
						status: 200,
						statusText: "OK",
						headers: {},
						body: "",
						durationMs: 1,
					};
				},
			},
			scripts,
		});

		expect(result.persistedVariables).toEqual({ token: "secret" });
	});
});
