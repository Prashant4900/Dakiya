import { z } from "zod";

/** Manifest schema version currently written by `dakiya init`. */
export const WORKSPACE_MANIFEST_VERSION = 1 as const;

export const HttpMethodSchema = z.enum([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
	"HEAD",
	"OPTIONS",
]);

export const RequestMetaSchema = z.object({
	name: z.string().min(1),
	type: z.literal("http"),
});

export const HttpRequestLineSchema = z.object({
	method: HttpMethodSchema,
	url: z.string().min(1),
	headers: z.record(z.string(), z.string()),
});

export const ScriptLangSchema = z.enum(["js", "ts"]);

export const ScriptBlockSchema = z.object({
	lang: ScriptLangSchema,
	source: z.string(),
});

export const ExampleResponseSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("inline"), content: z.string() }),
	z.object({ type: z.literal("file"), path: z.string().min(1) }),
]);

export const RequestExampleSchema = z.object({
	name: z.string().min(1),
	status: z.number().int().optional(),
	response: ExampleResponseSchema.optional(),
});

export const RequestAssertSchema = z.object({
	source: z.string(),
});

export const RequestDocumentSchema = z.object({
	relativePath: z.string(),
	meta: RequestMetaSchema,
	request: HttpRequestLineSchema,
	body: z.string().optional(),
	docs: z.string().optional(),
	pre: ScriptBlockSchema.optional(),
	post: ScriptBlockSchema.optional(),
	examples: z.array(RequestExampleSchema).optional(),
	asserts: z.array(RequestAssertSchema).optional(),
});

export const ResolvedHttpRequestSchema = z.object({
	method: HttpMethodSchema,
	url: z.string().min(1),
	headers: z.record(z.string(), z.string()),
	body: z.string().optional(),
});

export const SendResultSchema = z.object({
	status: z.number().int(),
	statusText: z.string(),
	headers: z.record(z.string(), z.string()),
	body: z.string(),
	durationMs: z.number().nonnegative(),
});

export const WorkspaceManifestSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	version: z.number().int().positive(),
	defaultEnv: z.string().optional(),
});

export const EnvironmentVariablesSchema = z.record(z.string(), z.string());

export const EnvironmentSchema = z.object({
	name: z.string().min(1),
	variables: EnvironmentVariablesSchema,
});
