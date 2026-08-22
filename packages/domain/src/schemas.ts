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

export const RequestBodySchema = z.union([
	z.string(),
	z.object({
		type: z.enum(["none", "raw", "form-data", "urlencoded", "binary", "graphql"]),
		raw: z.object({
			content: z.string(),
			format: z.enum(["json", "text", "javascript", "html", "xml"])
		}).optional(),
		formData: z.array(z.object({
			key: z.string(),
			value: z.string(),
			type: z.enum(["text", "file"]).default("text")
		})).optional(),
		urlencoded: z.array(z.object({
			key: z.string(),
			value: z.string()
		})).optional(),
		binary: z.object({
			file: z.string()
		}).optional(),
		graphql: z.object({
			query: z.string(),
			variables: z.string().optional()
		}).optional()
	})
]);

export const RequestDocumentSchema = z.object({
	relativePath: z.string(), // e.g. v2/users/get
	meta: RequestMetaSchema,
	request: HttpRequestLineSchema,
	body: RequestBodySchema.optional(),
	docs: z.string().optional(),
	pre: ScriptBlockSchema.optional(),
	post: ScriptBlockSchema.optional(),
	examples: z.array(RequestExampleSchema).optional(),
	asserts: z.array(RequestAssertSchema).optional(),
});

export const EndpointMethodSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	method: HttpMethodSchema,
	url: z.string().min(1),
	headers: z.record(z.string(), z.string()).optional(),
	body: RequestBodySchema.optional(),
});

export const EndpointManifestSchema = z.object({
	name: z.string().min(1),
	type: z.literal("http").default("http"),
	methods: z.array(EndpointMethodSchema),
});

export const ResolvedHttpRequestSchema = z.object({
	method: HttpMethodSchema,
	url: z.string().min(1),
	headers: z.record(z.string(), z.string()),
	body: RequestBodySchema.optional(),
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
