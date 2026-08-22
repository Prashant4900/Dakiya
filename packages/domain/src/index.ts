/** Shared domain types and Zod schemas. */

export const DOMAIN_VERSION = "0.0.0";

export type HelloMessage = {
	package: "@dakiya/domain";
	message: string;
};

export function hello(): HelloMessage {
	return {
		package: "@dakiya/domain",
		message: "Hello from @dakiya/domain",
	};
}

export type { Environment, EnvironmentVariables } from "./environment.js";
export type {
	EndpointManifest,
	EndpointMethod,
	ExampleResponse,
	HttpMethod,
	HttpRequestLine,
	RequestAssert,
	RequestDocument,
	RequestExample,
	RequestMeta,
	ResolvedHttpRequest,
	ScriptBlock,
	ScriptLang,
	SendResult,
} from "./request.js";
export {
	EndpointManifestSchema,
	EndpointMethodSchema,
	EnvironmentSchema,
	EnvironmentVariablesSchema,
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
	WorkspaceManifestSchema,
} from "./schemas.js";
export type { WorkspaceManifest } from "./workspace.js";
export { WORKSPACE_MANIFEST_VERSION } from "./workspace.js";
