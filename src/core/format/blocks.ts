/**
 * Shared block splitting for `.drq` parse and serialize.
 */

export type DrqBlock = {
	name: string;
	/** Raw attribute string after `@name`, e.g. `lang=js` or `Success`. */
	attrs: string;
	body: string;
};

export const KNOWN_BLOCKS = new Set([
	"meta",
	"request",
	"body",
	"docs",
	"pre",
	"post",
	"example",
	"assert",
]);

/** Split source into `@block` sections preserving order. */
export function splitBlocks(source: string): DrqBlock[] {
	const lines = source.replace(/\r\n/g, "\n").split("\n");
	const blocks: DrqBlock[] = [];
	let current: DrqBlock | null = null;
	const bodyLines: string[] = [];

	const flush = () => {
		if (!current) return;
		while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === "") {
			bodyLines.pop();
		}
		current.body = bodyLines.join("\n");
		blocks.push(current);
		bodyLines.length = 0;
		current = null;
	};

	for (const line of lines) {
		const match = /^@(\w+)(?:\s+(.*))?$/.exec(line);
		if (match) {
			flush();
			const blockName = match[1]?.toLowerCase();
			if (!blockName) continue;
			current = {
				name: blockName,
				attrs: (match[2] ?? "").trim(),
				body: "",
			};
			continue;
		}
		if (current) {
			bodyLines.push(line);
		}
	}
	flush();
	return blocks;
}

/** Join blocks back into `.drq` source. */
export function joinBlocks(blocks: DrqBlock[]): string {
	const parts: string[] = [];
	for (const block of blocks) {
		const header = block.attrs
			? `@${block.name} ${block.attrs}`
			: `@${block.name}`;
		parts.push(block.body ? `${header}\n${block.body}` : header);
	}
	return `${parts.join("\n\n")}\n`;
}
