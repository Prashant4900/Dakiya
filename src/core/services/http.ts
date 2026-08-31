import type { ResolvedHttpRequest, SendResult } from "@core/domain";

export type HttpClient = {
	send(request: ResolvedHttpRequest): Promise<SendResult>;
};

export type HttpClientOptions = {
	readFileAsBlob?: (path: string) => Promise<Blob>;
};

/** Default HttpClient using global `fetch` (Node 20+ / browsers). */
export function createFetchHttpClient(options?: HttpClientOptions): HttpClient {
	return {
		async send(request) {
			const started = Date.now();
			const init: RequestInit = {
				method: request.method,
				headers: request.headers,
			};
			if (
				request.body !== undefined &&
				request.method !== "GET" &&
				request.method !== "HEAD"
			) {
				if (typeof request.body === "string") {
					init.body = request.body;
				} else {
					const bodyDef = request.body;
					if (bodyDef.type === "raw" && bodyDef.raw) {
						init.body = bodyDef.raw.content;
					} else if (bodyDef.type === "urlencoded" && bodyDef.urlencoded) {
						const params = new URLSearchParams();
						for (const item of bodyDef.urlencoded) {
							params.append(item.key, item.value);
						}
						init.body = params;
					} else if (bodyDef.type === "form-data" && bodyDef.formData) {
						const formData = new FormData();
						for (const item of bodyDef.formData) {
							if (item.type === "file" && options?.readFileAsBlob) {
								try {
									const blob = await options.readFileAsBlob(item.value);
									formData.append(
										item.key,
										blob,
										item.value.split("/").pop() || "file",
									);
								} catch (err) {
									throw new Error(
										`Failed to read file ${item.value} for form-data: ${String(err)}`,
									);
								}
							} else {
								formData.append(item.key, item.value);
							}
						}
						init.body = formData;
						// fetch automatically sets multipart/form-data with boundary when passing FormData
						// So we make sure not to override it manually if they didn't specify one
					} else if (
						bodyDef.type === "binary" &&
						bodyDef.binary &&
						options?.readFileAsBlob
					) {
						try {
							init.body = await options.readFileAsBlob(bodyDef.binary.file);
						} catch (err) {
							throw new Error(
								`Failed to read binary file ${bodyDef.binary.file}: ${String(err)}`,
							);
						}
					} else if (bodyDef.type === "graphql" && bodyDef.graphql) {
						init.body = JSON.stringify({
							query: bodyDef.graphql.query,
							variables: bodyDef.graphql.variables
								? JSON.parse(bodyDef.graphql.variables)
								: undefined,
						});
					}
				}
			}
			let res: Response;
			try {
				res = await fetch(request.url, init);
			} catch (err) {
				const reason = err instanceof Error ? err.message : String(err);
				throw new Error(
					`Request to ${request.url} failed: ${reason}. Is the target server running?`,
				);
			}
			const body = await res.text();
			const headers: Record<string, string> = {};
			res.headers.forEach((value, key) => {
				headers[key] = value;
			});

			return {
				status: res.status,
				statusText: res.statusText,
				headers,
				body,
				durationMs: Date.now() - started,
			};
		},
	};
}
