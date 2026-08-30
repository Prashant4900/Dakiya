/**
 * Node vm sandbox for `@pre` / `@post` scripts.
 * No require / process / fs — only the MVP script API.
 */

import * as vm from "node:vm";
import type {
	MutableRequest,
	MutableResponse,
	RunScriptInput,
	RunScriptResult,
	ScriptRunner,
} from "@dakiya/services";
import { transformSync } from "esbuild";

const SCRIPT_TIMEOUT_MS = 2000;

type EnvSetOptions = {
	persist?: boolean;
};

function transpile(source: string, lang: "js" | "ts"): string {
	if (lang === "js") return source;
	const result = transformSync(source, {
		loader: "ts",
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
	return (input: RunScriptInput): RunScriptResult => {
		const logs: string[] = [];
		const persistedKeys = new Set<string>();
		const code = transpile(input.script.source, input.script.lang);

		const context = vm.createContext({
			req: buildReqApi(input.request),
			res: buildResApi(input.response),
			env: buildEnvApi(input.variables, persistedKeys),
			console: {
				log: (...args: unknown[]) => {
					logs.push(args.map(String).join(" "));
				},
				warn: (...args: unknown[]) => {
					logs.push(args.map(String).join(" "));
				},
				error: (...args: unknown[]) => {
					logs.push(args.map(String).join(" "));
				},
			},
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
			parseInt,
			parseFloat,
			isNaN,
			isFinite,
			encodeURIComponent,
			decodeURIComponent,
			undefined,
		});

		try {
			vm.runInContext(code, context, {
				timeout: SCRIPT_TIMEOUT_MS,
				displayErrors: true,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			throw new Error(`@${input.phase} script failed: ${message}`);
		}

		return {
			logs,
			persistedKeys: [...persistedKeys],
		};
	};
}
