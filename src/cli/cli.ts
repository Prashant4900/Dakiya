#!/usr/bin/env node
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
import { runRun } from "./commands/run.js";
import { runServe } from "./commands/serve.js";
import { runHello } from "./hello.js";

const [, , cmd, ...args] = process.argv;

function usage(exitCode = 0): never {
	console.log(`dakiya — local-first API toolkit

Usage:
  dakiya init                 Scaffold .dakiya/ (manifest, env, empty collections)
  dakiya list                 List requests under .dakiya/collections/
  dakiya run <path>           Send a request (e.g. health/health or users/list.drq)
  dakiya serve [--port N]     Start web dashboard + API at http://localhost:4242

`);
	process.exit(exitCode);
}

function parseServePort(argv: string[]): number {
	const defaultPort = 4242;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (!arg) continue;
		if (arg === "--port" || arg === "-p") {
			const value = argv[i + 1];
			if (!value || !/^\d+$/.test(value)) {
				console.error(`[dakiya] --port requires a number (e.g. --port 4242)`);
				process.exit(1);
			}
			const port = Number(value);
			if (port < 1 || port > 65535) {
				console.error(`[dakiya] Port must be between 1 and 65535`);
				process.exit(1);
			}
			return port;
		}
		if (arg.startsWith("--port=")) {
			const value = arg.slice("--port=".length);
			if (!/^\d+$/.test(value)) {
				console.error(`[dakiya] --port requires a number (e.g. --port=4242)`);
				process.exit(1);
			}
			const port = Number(value);
			if (port < 1 || port > 65535) {
				console.error(`[dakiya] Port must be between 1 and 65535`);
				process.exit(1);
			}
			return port;
		}
	}
	return defaultPort;
}

async function main(): Promise<void> {
	if (
		args.includes("-h") ||
		args.includes("--help") ||
		cmd === "-h" ||
		cmd === "--help"
	) {
		usage(0);
	}

	switch (cmd) {
		case "init":
			runInit();
			return;
		case "list":
			runList();
			return;
		case "run":
			await runRun(args[0]);
			return;
		case "serve":
			await runServe(parseServePort(args));
			return;
		case "hello":
			console.log(runHello());
			return;
		case undefined:
		case "help":
		case "--help":
		case "-h":
			usage(0);
			break;
		default:
			console.error(`Unknown command: ${cmd}\n`);
			usage(1);
	}
}

main().catch((err) => {
	console.error(`[dakiya] ${err instanceof Error ? err.message : err}`);
	process.exit(1);
});
