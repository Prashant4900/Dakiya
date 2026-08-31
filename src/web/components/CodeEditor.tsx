import { javascript } from "@codemirror/lang-javascript";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintKeymap } from "@codemirror/lint";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import {
	Decoration,
	type EditorView,
	hoverTooltip,
	keymap,
	MatchDecorator,
	ViewPlugin,
} from "@codemirror/view";
import { githubLight } from "@uiw/codemirror-theme-github";
import ReactCodeMirror from "@uiw/react-codemirror";

export type CodeEditorProps = {
	value: string;
	onChange?: (value: string) => void;
	language?: "json" | "javascript" | "text";
	readOnly?: boolean;
	style?: React.CSSProperties;
	className?: string;
	variables?: Record<string, string>;
};

export function CodeEditor({
	value,
	onChange,
	language = "json",
	readOnly = false,
	style,
	className,
	variables,
}: CodeEditorProps) {
	const extensions = [];

	if (language === "json") {
		extensions.push(json());
		extensions.push(linter(jsonParseLinter()));
		extensions.push(keymap.of(lintKeymap));
	} else if (language === "javascript") {
		extensions.push(javascript());
	}
	// "text" gets no language extension — plain text, no highlighting

	// Add custom highlight for {{env_vars}}
	const envVarDecorator = new MatchDecorator({
		regexp: /\{\{([^}]+)\}\}/g,
		decoration: (match) => {
			const varName = match[1].trim();
			const isResolved = variables && varName in variables;
			return Decoration.mark({
				class: `cm-env-var-highlight ${isResolved ? "" : "unresolved"}`,
			});
		},
	});

	const envVarPlugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			constructor(view: EditorView) {
				this.decorations = envVarDecorator.createDeco(view);
			}
			update(update: ViewUpdate) {
				this.decorations = envVarDecorator.updateDeco(update, this.decorations);
			}
		},
		{
			decorations: (v) => v.decorations,
		},
	);

	extensions.push(envVarPlugin);

	if (variables) {
		const envVarHover = hoverTooltip((view, pos) => {
			const { from, text } = view.state.doc.lineAt(pos);
			const regex = /\{\{([^}]+)\}\}/g;
			for (const match of text.matchAll(regex)) {
				const matchIndex = match.index;
				if (matchIndex === undefined) continue;
				const start = from + matchIndex;
				const end = start + match[0].length;
				if (pos >= start && pos <= end) {
					const varName = match[1].trim();
					const val = variables[varName];
					const isResolved = val !== undefined;

					return {
						pos: start,
						end,
						above: true,
						create() {
							const dom = document.createElement("div");
							dom.className = "env-var-popover";
							// CodeMirror tooltips have some default styles, but we reset/inherit
							dom.style.position = "static";
							dom.style.border = "none";
							dom.style.boxShadow = "none";
							dom.innerHTML = `
								<div class="env-var-popover-value">
									<input readonly class="${!isResolved ? "unresolved-input" : ""}" value="${isResolved ? val : "Unresolved Variable"}" />
								</div>
								<div class="env-var-popover-footer">
									<div class="env-var-popover-scope">
										<span class="env-var-popover-scope-icon">E</span> Environment
									</div>
								</div>
							`;
							return { dom };
						},
					};
				}
			}
			return null;
		});
		extensions.push(envVarHover);
	}

	return (
		<ReactCodeMirror
			value={value}
			onChange={onChange}
			theme={githubLight}
			extensions={extensions}
			readOnly={readOnly}
			editable={!readOnly}
			basicSetup={{
				lineNumbers: true,
				foldGutter: false,
				highlightActiveLine: false,
				highlightActiveLineGutter: false,
				dropCursor: false,
				allowMultipleSelections: false,
				indentOnInput: false,
			}}
			style={{
				fontSize: "13px",
				fontFamily: "var(--font-mono, monospace)",
				...style,
			}}
			className={className}
		/>
	);
}
