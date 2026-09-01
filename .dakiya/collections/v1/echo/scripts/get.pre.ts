import type { PreContext } from "dakiya/scripts";

export default async function ({ req, env, meta }: PreContext) {
	// Pre-request script runs before the HTTP request is dispatched.
	//
	// 1. Headers & Auth:
	// req.setHeader("Authorization", `Bearer ${env.get("token")}`);
	// req.setHeader("X-Request-Id", meta.traceId);
	//
	// 2. Request Body:
	// const body = req.body as Record<string, unknown>;
	// body.timestamp = Date.now();
	//
	// 3. Environment Variables:
	// const token = env.get("auth_token");
	env.set("message", "Hello, Nigam!"); // in-memory for this request run
	// env.set("auth_token", "new_token", { persist: true }); // saved to .json env file
	env.commit();
}
