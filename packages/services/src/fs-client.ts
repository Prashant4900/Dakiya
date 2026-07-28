/**
 * Injectable filesystem contract — no Node imports in services.
 */

export type FsDirEntry = {
	name: string;
	isDirectory: boolean;
	isFile: boolean;
};

export type FsClient = {
	readFile(path: string): string;
	writeFile(path: string, content: string): void;
	exists(path: string): boolean;
	mkdir(path: string): void;
	removeFile(path: string): void;
	readDir(path: string): FsDirEntry[];
};
