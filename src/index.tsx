import { useMemo, useState, type FC } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput } from "react-native";

import { tokenize } from "./highlight";
import { patternsFor, type Language } from "./langs";

export interface CodeEditorProps {
	/** Optional language for syntax highlighting */
	language?: Language;
	/** Starting contents. Only read on first render; ignored when `value` is set. */
	initialValue?: string;
	/** Contents of the editor. Passing this makes the editor controlled. */
	value?: string;
	/** Called with the new contents whenever the user edits */
	onChange?(value: string): void;
	/** Whether to focus the editor on mount */
	autoFocus?: boolean;
}

const CodeEditor: FC<CodeEditorProps> = ({
	autoFocus = true,
	initialValue,
	language,
	onChange,
	value
}) => {
	const [uncontrolledCode, setUncontrolledCode] = useState<string>(initialValue ?? "");

	const isControlled = value !== undefined;
	const code = isControlled ? value : uncontrolledCode;

	const patterns = useMemo(() => (language ? patternsFor(language) : null), [language]);
	const tokens = useMemo(() => (patterns ? tokenize(code, patterns) : null), [code, patterns]);

	function handleChangeText(text: string) {
		// A controlled editor renders whatever the parent sends back instead.
		if(!isControlled) {
			setUncontrolledCode(text);
		}

		onChange?.(text);
	}

	return (
		<ScrollView alwaysBounceVertical={false} style={styles.scrollView}>
			<Text style={[styles.text, styles.highlight]}>
				{tokens
					? tokens.map((token, index) => (
						<Text key={index} style={token.style}>{token.text}</Text>
					))
					: code}
			</Text>

			<TextInput
				autoCapitalize="none"
				autoCorrect={false}
				autoFocus={autoFocus}
				multiline={true}
				onChangeText={handleChangeText}
				returnKeyType="next"
				spellCheck={false}
				style={[styles.text, styles.input]}
				textContentType="none"
				value={code}
			/>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	highlight: {
		left: 0,
		position: "absolute",
		right: 0,
		top: 0
	},
	input: {
		// The input is stacked over the highlighted copy of the same text, so
		// only its caret and selection should be visible.
		color: "transparent"
	},
	scrollView: {
		flex: 1
	},
	text: {
		// Both layers have to share these metrics exactly. When they diverge the
		// caret drifts further from the highlighted text on every line.
		fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
		fontSize: 14,
		includeFontPadding: false,
		lineHeight: 20,
		padding: 12,
		textAlignVertical: "top"
	}
});

export default CodeEditor;
export type { Language };
export { supportedLanguages } from "./langs";
