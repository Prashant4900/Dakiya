#!/usr/bin/env node
import { cac } from "cac";
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
import { runRun } from "./commands/run.js";
import { runServe } from "./commands/serve.js";
import { DEFAULT_PORT } from "./constants.js";

const cli = cac("dakiya");

cli
	.command("init", "Scaffold .dakiya/ (manifest, env, empty collections)")
	.action(() => {
		runInit();
	});

cli.command("list", "List requests under .dakiya/collections/").action(() => {
	runList();
});

cli
	.command("run <path>", "Send a request (e.g. health/health or users/list)")
	.action(async (path: string) => {
		await runRun(path);
	});

cli
	.command("serve", "Start web dashboard + API")
	.option("-p, --port <number>", "Port to run on", {
		default: DEFAULT_PORT,
	})
	.action(async (options: { port: number | string }) => {
		const portNum = Number(options.port);
		if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
			console.error("[dakiya] Port must be a number between 1 and 65535");
			process.exit(1);
		}
		await runServe(portNum);
	});

cli.help();

try {
	cli.parse();
} catch (err) {
	console.error(`[dakiya] ${err instanceof Error ? err.message : err}`);
	process.exit(1);
}
