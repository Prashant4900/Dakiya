import ReactCodeMirror from "@uiw/react-codemirror";
import { githubLight } from "@uiw/codemirror-theme-github";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { linter, lintKeymap } from "@codemirror/lint";
import { keymap } from "@codemirror/view";

export type CodeEditorProps = {
	value: string;
	onChange?: (value: string) => void;
	language?: "json" | "javascript" | "text";
	readOnly?: boolean;
	style?: React.CSSProperties;
	className?: string;
};

export function CodeEditor({
	value,
	onChange,
	language = "json",
	readOnly = false,
	style,
	className,
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
