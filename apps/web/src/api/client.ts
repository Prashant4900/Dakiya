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
	updates: Record<string, unknown>,
): Promise<{ success: true; relativeToCollections: string }> {
	return request(`/requests/${path}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(updates),
	});
}

export function createRequestAPI(
	path: string,
): Promise<{ success: true; relativeToCollections: string }> {
	return request(`/requests/${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
	});
}

export function uploadFile(file: File): Promise<{ path: string }> {
	const formData = new FormData();
	formData.append("file", file);
	return request<{ path: string }>("/upload", {
		method: "POST",
		body: formData,
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

export function createEnvironment(name: string): Promise<{ ok: true }> {
	const skeleton = `# ${name} environment\n# Add key: value pairs below\n`;
	return saveEnvironment(name, skeleton);
}


export async function saveScript(
	path: string,
	type: "pre" | "post",
	source: string,
): Promise<void> {
	await request(`/requests/${path}/scripts/${type}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ source }),
	});
}

export async function deleteScript(
	path: string,
	type: "pre" | "post",
): Promise<void> {
	await request(`/requests/${path}/scripts/${type}`, {
		method: "DELETE",
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

export function renameFolderAPI(
	folderPath: string,
	newName: string,
): Promise<{ success: true; oldPath: string; newPath: string }> {
	return request(`/folders/${folderPath}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "rename", newName }),
	});
}

export function deleteFolderAPI(
	folderPath: string,
): Promise<{ success: true }> {
	return request(`/folders/${folderPath}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "delete" }),
	});
}

export function renameRequestAPI(
	requestPath: string,
	newName: string,
): Promise<{ success: true }> {
	return request(`/requests/${requestPath}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "rename", newName }),
	});
}

export function deleteRequestAPI(
	requestPath: string,
): Promise<{ success: true }> {
	return request(`/requests/${requestPath}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "delete" }),
	});
}

export function moveRequestAPI(
	requestPath: string,
	toFolder: string,
): Promise<{ success: true; newPath: string }> {
	return request(`/requests/${requestPath}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ action: "move", toFolder }),
	});
}

export function createFolderAPI(
	folderPath: string,
): Promise<{ success: true; newPath: string }> {
	return request("/folders", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ folderPath }),
	});
}
