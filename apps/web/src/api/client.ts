import type {
	ApiError,
	EnvironmentResponse,
	RequestResponse,
	SendResponse,
	WorkspaceResponse,
} from "./types.js";

const API = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`${API}${path}`, init);
	} catch {
		throw new Error(
			"Cannot reach Dakiya API. Run `dakiya serve` from a project with `.dakiya/`.",
		);
	}

	const text = await res.text();
	let data: T | ApiError;
	try {
		data = text ? (JSON.parse(text) as T | ApiError) : ({} as T);
	} catch {
		throw new Error(`Invalid API response (${res.status})`);
	}

	if (!res.ok) {
		const message =
			typeof data === "object" &&
			data !== null &&
			"error" in data &&
			typeof (data as ApiError).error === "string"
				? (data as ApiError).error
				: `Request failed (${res.status})`;
		throw new Error(message);
	}

	return data as T;
}

export function fetchWorkspace(): Promise<WorkspaceResponse> {
	return request<WorkspaceResponse>("/workspace");
}

export function fetchRequest(path: string): Promise<RequestResponse> {
	return request<RequestResponse>(`/requests/${path}`);
}

export function saveRequest(
	path: string,
	source: string,
): Promise<{ ok: true }> {
	return request(`/requests/${path}`, {
		method: "PUT",
		headers: { "Content-Type": "text/plain" },
		body: source,
	});
}

export function fetchEnvironment(name: string): Promise<EnvironmentResponse> {
	return request<EnvironmentResponse>(`/environments/${name}`);
}

export function saveEnvironment(
	name: string,
	source: string,
): Promise<{ ok: true }> {
	return request(`/environments/${name}`, {
		method: "PUT",
		headers: { "Content-Type": "text/plain" },
		body: source,
	});
}

export function sendRequestApi(
	path: string,
	env: string,
): Promise<SendResponse> {
	return request<SendResponse>("/send", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ path, env }),
	});
}
