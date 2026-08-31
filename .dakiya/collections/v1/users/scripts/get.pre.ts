import type { PreContext } from "dakiya/scripts";

export default async function ({ req, env, meta }: PreContext) {
	// Mutate the request before it's sent
	// Example: inject a header
	// req.setHeader("X-Request-Id", meta.traceId);
	//
	// Example: modify the request body
	// const body = req.body as Record<string, unknown>;
	// body.timestamp = Date.now();
	//
	// Example: read an env variable
	// const token = env.get("auth_token");
}
