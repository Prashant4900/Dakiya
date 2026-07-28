import type { IncomingMessage, ServerResponse } from "node:http";
import type { Hono } from "hono";

function readBody(req: IncomingMessage): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		const onData = (chunk: string | Buffer) => {
			chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
		};
		const onEnd = () => {
			cleanup();
			resolve(Buffer.concat(chunks));
		};
		const onError = (err: Error) => {
			cleanup();
			reject(err);
		};
		const cleanup = () => {
			req.off("data", onData);
			req.off("end", onEnd);
			req.off("error", onError);
		};
		req.on("data", onData);
		req.on("end", onEnd);
		req.on("error", onError);
	});
}

/**
 * Adapt a Node IncomingMessage into a Fetch API Request for Hono,
 * rewriting the URL path (already stripped of `/api` by the caller).
 */
export async function nodeToWebRequest(
	req: IncomingMessage,
	pathAndQuery: string,
): Promise<Request> {
	const host = req.headers.host ?? "localhost";
	const url = new URL(
		pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`,
		`http://${host}`,
	);

	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (value === undefined) continue;
		if (Array.isArray(value)) {
			for (const v of value) headers.append(key, v);
		} else {
			headers.set(key, value);
		}
	}

	const method = (req.method ?? "GET").toUpperCase();
	const init: RequestInit & { duplex?: "half" } = { method, headers };

	if (method !== "GET" && method !== "HEAD") {
		const body = await readBody(req);
		if (body.length > 0) {
			init.body = new Uint8Array(body);
			init.duplex = "half";
		}
	}

	return new Request(url, init);
}

/** Write a Fetch Response back onto a Node ServerResponse. */
export async function writeWebResponse(
	webRes: Response,
	res: ServerResponse,
): Promise<void> {
	res.statusCode = webRes.status;
	webRes.headers.forEach((value, key) => {
		if (key.toLowerCase() === "transfer-encoding") return;
		res.setHeader(key, value);
	});

	const buffer = Buffer.from(await webRes.arrayBuffer());
	res.end(buffer);
}

/** Connect-style middleware that forwards `/api/*` to a Hono app. */
export function createHonoMiddleware(app: Hono, apiPrefix = "/api") {
	return async (
		req: IncomingMessage,
		res: ServerResponse,
		next: (err?: unknown) => void,
	) => {
		const url = req.url ?? "/";
		if (!url.startsWith(apiPrefix)) {
			next();
			return;
		}

		try {
			const stripped = url.slice(apiPrefix.length) || "/";
			const pathAndQuery = stripped.startsWith("/") ? stripped : `/${stripped}`;
			const webReq = await nodeToWebRequest(req, pathAndQuery);
			const webRes = await app.fetch(webReq);
			await writeWebResponse(webRes, res);
		} catch (err) {
			next(err);
		}
	};
}
