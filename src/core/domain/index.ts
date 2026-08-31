/** Shared domain types and Zod schemas. */

export const DOMAIN_VERSION = "0.0.0";

export type HelloMessage = {
	package: "@core/domain";
	message: string;
};

export function hello(): HelloMessage {
	return {
		package: "@core/domain",
		message: "Hello from @core/domain",
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
	RequestBody,
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
	RequestBodySchema,
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
