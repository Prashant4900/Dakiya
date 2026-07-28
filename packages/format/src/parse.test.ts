import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseDrq, serializeDrq } from "./index.js";

const fixturesDir = join(
	dirname(fileURLToPath(import.meta.url)),
	"__fixtures__",
);

function loadFixture(name: string): string {
	return readFileSync(join(fixturesDir, name), "utf8");
}

function normalizeDrq(source: string): string {
	return `${source.replace(/\r\n/g, "\n").trimEnd()}\n`;
}

describe("parseDrq", () => {
	it("parses a full fixture with scripts, examples, and asserts", () => {
		const source = loadFixture("login.drq");
		const doc = parseDrq(source, "collections/auth/login.drq");

		expect(doc.meta).toEqual({ name: "Login", type: "http" });
		expect(doc.request.method).toBe("POST");
		expect(doc.request.url).toBe("{{baseUrl}}/auth/login");
		expect(doc.request.headers["Content-Type"]).toBe("application/json");
		expect(doc.body).toContain('"email"');
		expect(doc.docs).toContain("# Login");
		expect(doc.pre?.lang).toBe("js");
		expect(doc.post?.lang).toBe("ts");
		expect(doc.examples).toHaveLength(2);
		expect(doc.examples?.[0]).toMatchObject({
			name: "Success",
			status: 200,
			response: { type: "file", path: "examples/auth/login-200.json" },
		});
		expect(doc.examples?.[1]?.response).toEqual({
			type: "inline",
			content: '{\n  "error": "unauthorized"\n}',
		});
		expect(doc.asserts).toEqual([{ source: "res.status === 200" }]);
	});

	it("parses minimal health request", () => {
		const source = `@meta
name: Health
type: http

@request
GET {{baseUrl}}/api/health
`;
		const doc = parseDrq(source);
		expect(doc.meta.name).toBe("Health");
		expect(doc.request.method).toBe("GET");
		expect(doc.body).toBeUndefined();
	});

	it("throws on missing @request", () => {
		expect(() => parseDrq("@meta\nname: X\ntype: http\n")).toThrow(
			"Missing @request",
		);
	});
});

describe("serializeDrq", () => {
	it("round-trips the login fixture", () => {
		const source = normalizeDrq(loadFixture("login.drq"));
		const doc = parseDrq(source, "collections/auth/login.drq");
		const serialized = normalizeDrq(serializeDrq(doc));
		const reparsed = parseDrq(serialized, doc.relativePath);

		expect(reparsed).toEqual(doc);
		expect(serialized).toBe(source);
	});

	it("round-trips minimal request", () => {
		const source = normalizeDrq(`@meta
name: Health
type: http

@request
GET {{baseUrl}}/api/health
`);
		const doc = parseDrq(source);
		const roundTrip = normalizeDrq(serializeDrq(doc));
		expect(roundTrip).toBe(source);
		expect(parseDrq(roundTrip)).toEqual(doc);
	});
});
