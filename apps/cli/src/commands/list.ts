import {
	listEnvironmentNames,
	listEndpointPaths,
	readEndpointRequests,
	requireWorkspace,
} from "../workspace.js";

export async function runList(): Promise<void> {
	requireWorkspace();

	const envs = listEnvironmentNames();
	console.log("Environments:");
	if (envs.length === 0) {
		console.log("  (none)");
	} else {
		for (const env of envs) {
			console.log(`  - ${env}`);
		}
	}
	console.log("");

	const endpoints = listEndpointPaths();
	console.log("Requests:");
	if (endpoints.length === 0) {
		console.log("  (none)");
	} else {
		for (const endpoint of endpoints) {
			try {
				const requests = readEndpointRequests(endpoint);
				for (const req of requests) {
					console.log(`  - ${req.relativePath}  (${req.request.method} ${req.request.url})`);
				}
			} catch (err) {
				console.log(`  - ${endpoint}  (error loading)`);
			}
		}
	}
}
