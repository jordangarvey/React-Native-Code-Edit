import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ComponentRef } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";

import { tokenize, type TokenType } from "./highlight";
import { rulesFor, type Language } from "./langs";
import { themes, type CodeEditorTheme, type ThemeName } from "./themes";

/** TextInput props the editor sets itself, and so will not accept from callers. */
type ReservedInputProps = "autoFocus" | "editable" | "multiline" | "onChangeText" | "style" | "value";

export interface CodeEditorProps {
	/** Language to highlight. Omit for plain, uncoloured text. */
	language?: Language;
	/** Starting contents. Read on first render only, and ignored when `value` is set. */
	initialValue?: string;
	/** Contents of the editor. Passing this makes the editor controlled. */
	value?: string;
	/** Called with the new contents whenever the user edits */
	onChange?(value: string): void;
	/** Whether to focus the editor on mount. Defaults to true unless `readOnly`. */
	autoFocus?: boolean;
	/** Render the code but refuse edits, for showing a snippet. */
	readOnly?: boolean;
	/** A built-in theme name, or your own colours. */
	theme?: ThemeName | CodeEditorTheme;
	fontSize?: number;
	fontFamily?: string;
	/** Defaults to 1.5x the font size. */
	lineHeight?: number;
	padding?: number;
	/** Style for the scrolling container. */
	style?: StyleProp<ViewStyle>;
	/** Escape hatch onto the underlying TextInput. */
	inputProps?: Omit<TextInputProps, ReservedInputProps>;
}

export interface CodeEditorHandle {
	focus(): void;
	blur(): void;
	/**
	 * Empties the editor. A controlled editor still shows whatever its parent
	 * sends back, so the `onChange("")` this fires has to be honoured.
	 */
	clear(): void;
}

const defaultFontFamily = Platform.select({ ios: "Menlo", default: "monospace" });

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor({
	autoFocus,
	fontFamily,
	fontSize = 14,
	initialValue,
	inputProps,
	language,
	lineHeight,
	onChange,
	padding = 12,
	readOnly = false,
	style,
	theme = "light",
	value
}, ref) {
	const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
	const [uncontrolledCode, setUncontrolledCode] = useState<string>(initialValue ?? "");

	const isControlled = value !== undefined;
	const code = isControlled ? value : uncontrolledCode;

	const palette = typeof theme === "string" ? themes[theme] : theme;

	const handleChangeText = useCallback((text: string) => {
		// A controlled editor renders whatever its parent sends back instead.
		if(!isControlled) {
			setUncontrolledCode(text);
		}

		onChange?.(text);
	}, [isControlled, onChange]);

	useImperativeHandle(ref, () => ({
		blur: () => inputRef.current?.blur(),
		clear: () => handleChangeText(""),
		focus: () => inputRef.current?.focus()
	}), [handleChangeText]);

	const rules = useMemo(() => (language ? rulesFor(language) : null), [language]);
	const tokens = useMemo(() => (rules ? tokenize(code, rules) : null), [code, rules]);

	// Both layers are given these together. Letting them drift apart is what
	// makes the caret wander away from the text underneath it.
	const metrics = useMemo<TextStyle>(() => ({
		fontFamily: fontFamily ?? defaultFontFamily,
		fontSize,
		includeFontPadding: false,
		lineHeight: lineHeight ?? Math.round(fontSize * 1.5),
		padding,
		textAlignVertical: "top"
	}), [fontFamily, fontSize, lineHeight, padding]);

	const colours = useMemo<Record<TokenType, TextStyle>>(() => ({
		comment: { color: palette.comment },
		keyword: { color: palette.keyword },
		number: { color: palette.number },
		plain: { color: palette.plain },
		string: { color: palette.string }
	}), [palette.comment, palette.keyword, palette.number, palette.plain, palette.string]);

	return (
		<ScrollView
			alwaysBounceVertical={false}
			style={[styles.container, { backgroundColor: palette.background }, style]}
		>
			<Text style={[metrics, styles.highlight, colours.plain]}>
				{tokens
					? tokens.map((token, index) => (
						<Text key={index} style={colours[token.type]}>{token.text}</Text>
					))
					: code}
			</Text>

			<TextInput
				autoCapitalize="none"
				autoComplete="off"
				autoCorrect={false}
				spellCheck={false}
				textContentType="none"
				{...inputProps}
				autoFocus={autoFocus ?? !readOnly}
				editable={!readOnly}
				multiline={true}
				onChangeText={handleChangeText}
				ref={inputRef}
				selectionColor={inputProps?.selectionColor ?? palette.caret}
				style={[metrics, styles.input]}
				value={code}
			/>
		</ScrollView>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	highlight: {
		left: 0,
		position: "absolute",
		right: 0,
		top: 0
	},
	input: {
		// Stacked over the highlighted copy of the same text, so only the caret
		// and selection should be visible.
		color: "transparent"
	}
});

export default CodeEditor;

export { rulesFor, supportedLanguages } from "./langs";
export { themes } from "./themes";
export { tokenize } from "./highlight";

export type { CodeEditorTheme, ThemeName } from "./themes";
export type { Delimiters, Language, LanguageDefinition } from "./langs";
export type { HighlightRule, Token, TokenType } from "./highlight";
