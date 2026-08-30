export type CollectionNode =
	| { name: string; type: "folder"; children: CollectionNode[] }
	| { name: string; type: "request"; path: string };

export type WorkspaceManifest = {
	name: string;
	description?: string;
	versions?: string[];
	defaultVersionName?: string;
	defaultEnv?: string;
};

export type RequestIndexItem = {
	path: string;
	name: string;
	method: string;
};

export type WorkspaceResponse = {
	manifest: WorkspaceManifest;
	requests: string[];
	requestIndex: RequestIndexItem[];
	tree: CollectionNode[];
	environments: string[];
	cwd: string;
};

export type ScriptBlock = {
	lang: "js" | "ts";
	source: string;
};

export type ExampleResponse =
	| { type: "inline"; content: string }
	| { type: "file"; path: string };

export type RequestExample = {
	name: string;
	status?: number;
	response?: ExampleResponse;
};

export type RequestDocument = {
	relativePath: string;
	meta: { name: string; type: "http" };
	request: {
		method: string;
		url: string;
		headers: Record<string, string>;
	};
	body?: string;
	docs?: string;
	pre?: ScriptBlock;
	post?: ScriptBlock;
	examples?: RequestExample[];
	asserts?: { source: string }[];
};

export type RequestResponse = {
	path: string;
	relativePath: string;
	source: string;
	document: RequestDocument;
};

export type EnvironmentResponse = {
	name: string;
	source: string;
	environment: {
		name: string;
		variables: Record<string, string>;
	};
};

export type SendResponse = {
	path: string;
	env: string;
	resolved: {
		method: string;
		url: string;
		headers: Record<string, string>;
		body?: string;
	};
	response: {
		status: number;
		statusText: string;
		headers: Record<string, string>;
		body: string;
		durationMs: number;
	};
	variables: Record<string, string>;
	persistedVariables: Record<string, string>;
	logs: string[];
};

export type ApiError = { error: string };
