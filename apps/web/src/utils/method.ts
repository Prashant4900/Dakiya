export function methodBadgeClass(method: string): string {
	switch (method.toUpperCase()) {
		case "GET":
			return "badge-get";
		case "POST":
			return "badge-post";
		case "PUT":
			return "badge-put";
		case "PATCH":
			return "badge-patch";
		case "DELETE":
			return "badge-del";
		default:
			return "badge-get";
	}
}

export function methodColorVar(method: string): string {
	switch (method.toUpperCase()) {
		case "POST":
			return "var(--post)";
		case "PUT":
			return "var(--put)";
		case "PATCH":
			return "var(--patch)";
		case "DELETE":
			return "var(--del)";
		default:
			return "var(--get)";
	}
}

export function formatBytes(text: string): string {
	const bytes = new TextEncoder().encode(text).length;
	if (bytes < 1024) return `${bytes} B`;
	return `${(bytes / 1024).toFixed(1)} KB`;
}
