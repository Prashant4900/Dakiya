import type { Environment } from "@dakiya/domain";
import { parseEnvironment } from "./environment.js";
import type { FsClient } from "./fs-client.js";
import { environmentPath } from "./paths.js";
import { loadManifest } from "./workspace-service.js";

export function loadEnvironment(
	fs: FsClient,
	envName: string,
	cwd: string,
): Environment {
	const file = environmentPath(cwd, envName);
	if (!fs.exists(file)) {
		throw new Error(`Environment not found: environments/${envName}.yaml`);
	}
	return parseEnvironment(envName, fs.readFile(file));
}

export function readEnvironmentSource(
	fs: FsClient,
	envName: string,
	cwd: string,
): string {
	const file = environmentPath(cwd, envName);
	if (!fs.exists(file)) {
		throw new Error(`Environment not found: environments/${envName}.yaml`);
	}
	return fs.readFile(file);
}

export function writeEnvironmentSource(
	fs: FsClient,
	envName: string,
	source: string,
	cwd: string,
): void {
	const file = environmentPath(cwd, envName);
	const parent = file.slice(0, file.lastIndexOf("/"));
	if (parent && !fs.exists(parent)) {
		fs.mkdir(parent);
	}
	fs.writeFile(file, source);
}

export function loadActiveEnvironment(fs: FsClient, cwd: string): Environment {
	const manifest = loadManifest(fs, cwd);
	const envName = manifest.defaultEnv ?? "local";
	return loadEnvironment(fs, envName, cwd);
}
