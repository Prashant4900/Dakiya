import ReactCodeMirror from "@uiw/react-codemirror";
import { githubLight } from "@uiw/codemirror-theme-github";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";

export type CodeEditorProps = {
	value: string;
	onChange?: (value: string) => void;
	language?: "json" | "javascript";
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
	const extensions = [language === "json" ? json() : javascript()];

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
