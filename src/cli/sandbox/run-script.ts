/**
 * Node vm sandbox for `@pre` / `@post` scripts.
 *
 * Supports two script styles:
 *
 * 1. Function-based (recommended, TypeScript-first):
 *    export default async function({ req, res, env, meta }) { ... }
 *
 * 2. Legacy top-level (backwards-compatible):
 *    req.setHeader("X-Foo", "bar");
 *
 * No require / process / fs — only the Dakiya script API.
 */

import * as vm from "node:vm";
import type {
	MutableRequest,
	MutableResponse,
	RunScriptInput,
	RunScriptResult,
	ScriptRunner,
} from "@core/services";
import { transformSync } from "esbuild";

const SCRIPT_TIMEOUT_MS = 2000;

type EnvSetOptions = {
	persist?: boolean;
};

function transpile(source: string, lang: "js" | "ts"): string {
	// Always compile via esbuild — converts ESM exports to CJS.
	const result = transformSync(source, {
		loader: lang === "ts" ? "ts" : "js",
		format: "cjs",
		target: "es2022",
	});
	return result.code;
}

function buildReqApi(request: MutableRequest) {
	return {
		get method() {
			return request.method;
		},
		set method(value: string) {
			request.method = value.toUpperCase() as MutableRequest["method"];
		},
		get url() {
			return request.url;
		},
		set url(value: string) {
			request.url = value;
		},
		get body() {
			return request.body;
		},
		// biome-ignore lint/suspicious/noExplicitAny: user scripts can set body to any valid shape
		set body(value: any) {
			request.body = value;
		},
		getHeader(name: string): string | undefined {
			const lower = name.toLowerCase();
			for (const [key, value] of Object.entries(request.headers)) {
				if (key.toLowerCase() === lower) return value;
			}
			return undefined;
		},
		setHeader(name: string, value: string): void {
			request.headers[name] = value;
		},
		removeHeader(name: string): void {
			const lower = name.toLowerCase();
			for (const key of Object.keys(request.headers)) {
				if (key.toLowerCase() === lower) {
					delete request.headers[key];
				}
			}
		},
	};
}

function buildResApi(response: MutableResponse | undefined) {
	if (!response) {
		return {
			get status() {
				throw new Error("res is only available in @post scripts");
			},
			statusText: "",
			body: "",
			json() {
				throw new Error("res is only available in @post scripts");
			},
			getHeader() {
				throw new Error("res is only available in @post scripts");
			},
			setHeader() {
				throw new Error("res is only available in @post scripts");
			},
		};
	}

	return {
		get status() {
			return response.status;
		},
		set status(value: number) {
			response.status = value;
		},
		get statusText() {
			return response.statusText;
		},
		set statusText(value: string) {
			response.statusText = value;
		},
		get body() {
			return response.body;
		},
		set body(value: string) {
			response.body = value;
		},
		json(): unknown {
			return JSON.parse(response.body || "null");
		},
		getHeader(name: string): string | undefined {
			const lower = name.toLowerCase();
			for (const [key, value] of Object.entries(response.headers)) {
				if (key.toLowerCase() === lower) return value;
			}
			return undefined;
		},
		setHeader(name: string, value: string): void {
			response.headers[name] = value;
		},
	};
}

function buildEnvApi(
	variables: Record<string, string>,
	persistedKeys: Set<string>,
) {
	return {
		get(name: string): string | undefined {
			return variables[name];
		},
		set(name: string, value: string, options?: EnvSetOptions): void {
			variables[name] = String(value);
			if (options?.persist) {
				persistedKeys.add(name);
			}
		},
		delete(name: string): void {
			delete variables[name];
			persistedKeys.delete(name);
		},
	};
}

/** Create a ScriptRunner backed by node:vm. */
export function createVmScriptRunner(): ScriptRunner {
	return async (input: RunScriptInput): Promise<RunScriptResult> => {
		const logs: string[] = [];
		const persistedKeys = new Set<string>();
		const code = transpile(input.script.source, input.script.lang);

		const req = buildReqApi(input.request);
		const res = buildResApi(input.response);
		const env = buildEnvApi(input.variables, persistedKeys);
		const meta = { ...input.meta };

		const consoleMock = {
			log: (...args: unknown[]) => {
				logs.push(args.map(String).join(" "));
			},
			warn: (...args: unknown[]) => {
				logs.push(args.map(String).join(" "));
			},
			error: (...args: unknown[]) => {
				logs.push(args.map(String).join(" "));
			},
		};

		// CJS shim — esbuild compiles ESM `export default` into `module.exports`.
		const moduleShim = { exports: {} as Record<string, unknown> };

		const context = vm.createContext({
			// Script API
			req,
			res,
			env,
			meta,
			console: consoleMock,
			// CJS shim for function-based exports
			module: moduleShim,
			exports: moduleShim.exports,
			// Safe globals only
			crypto: {
				randomUUID: () => crypto.randomUUID(),
			},
			JSON,
			Math,
			Date,
			Number,
			String,
			Boolean,
			Array,
			Object,
			Promise,
			parseInt,
			parseFloat,
			isNaN,
			isFinite,
			encodeURIComponent,
			decodeURIComponent,
			undefined,
		});

		// Run the compiled CJS code. For legacy top-level scripts, this is where
		// the mutations happen. For function-based scripts, this populates exports.
		try {
			vm.runInContext(code, context, {
				timeout: SCRIPT_TIMEOUT_MS,
				displayErrors: true,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			throw new Error(`@${input.phase} script failed: ${message}`);
		}

		// ── Function-based style: export default async function({ req, env, meta }) ──
		// esbuild converts `export default fn` to `Object.defineProperty(exports, "default", ...)`
		// or `exports.default = fn`. We check for it and invoke it with the full context.
		const defaultExport = moduleShim.exports.default;
		if (typeof defaultExport === "function") {
			try {
				await Promise.resolve(defaultExport({ req, res, env, meta }));
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				throw new Error(`@${input.phase} script failed: ${message}`);
			}
		}
		// ── Legacy style: top-level code already ran above — nothing extra to do ──

		return {
			logs,
			persistedKeys: [...persistedKeys],
		};
	};
}
