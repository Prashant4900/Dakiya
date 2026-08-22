/**
 * Parsed HTTP request — maps to a single `.drq` file under `.dakiya/collections/`.
 */

import type { z } from "zod";
import type {
	EndpointManifestSchema,
	EndpointMethodSchema,
	ExampleResponseSchema,
	HttpMethodSchema,
	HttpRequestLineSchema,
	RequestAssertSchema,
	RequestDocumentSchema,
	RequestExampleSchema,
	RequestMetaSchema,
	ResolvedHttpRequestSchema,
	ScriptBlockSchema,
	ScriptLangSchema,
	SendResultSchema,
} from "./schemas.js";

export type HttpMethod = z.infer<typeof HttpMethodSchema>;
export type RequestMeta = z.infer<typeof RequestMetaSchema>;
export type HttpRequestLine = z.infer<typeof HttpRequestLineSchema>;
export type ScriptLang = z.infer<typeof ScriptLangSchema>;
export type ScriptBlock = z.infer<typeof ScriptBlockSchema>;
export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;
export type RequestExample = z.infer<typeof RequestExampleSchema>;
export type RequestAssert = z.infer<typeof RequestAssertSchema>;
export type RequestDocument = z.infer<typeof RequestDocumentSchema>;
export type ResolvedHttpRequest = z.infer<typeof ResolvedHttpRequestSchema>;
export type SendResult = z.infer<typeof SendResultSchema>;
export type EndpointManifest = z.infer<typeof EndpointManifestSchema>;
export type EndpointMethod = z.infer<typeof EndpointMethodSchema>;
