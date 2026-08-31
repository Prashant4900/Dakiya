import * as fs from "node:fs";
import * as path from "node:path";
import type { FsClient, FsDirEntry } from "@core/services";

/** Node.js FsClient adapter for the CLI. */
export function createNodeFsClient(): FsClient {
	return {
		readFile(filePath: string) {
			return fs.readFileSync(filePath, "utf8");
		},
		writeFile(filePath: string, content: string) {
			fs.mkdirSync(path.dirname(filePath), { recursive: true });
			fs.writeFileSync(filePath, content, "utf8");
		},
		exists(filePath: string) {
			return fs.existsSync(filePath);
		},
		mkdir(dirPath: string) {
			fs.mkdirSync(dirPath, { recursive: true });
		},
		removeFile(filePath: string) {
			fs.unlinkSync(filePath);
		},
		readDir(dirPath: string): FsDirEntry[] {
			return fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => ({
				name: entry.name,
				isDirectory: entry.isDirectory(),
				isFile: entry.isFile(),
			}));
		},
		renameDir(from: string, to: string) {
			fs.renameSync(from, to);
		},
		removeDir(dirPath: string) {
			fs.rmSync(dirPath, { recursive: true, force: true });
		},
	};
}
