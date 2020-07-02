import React, { FC, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, TextStyle, StyleProp } from "react-native";

import ParsedText from "react-native-parsed-text";


interface ICodeEditorProps {
	/** Optional language for syntax highlighting */
	language?: "java" | "javascript";
	/** Optionally set the initial value of the editor */
	initialValue?: string;
	/** Optional callback called with the current value of the editor */
	onChange?(value: string): void;
}

const CodeEditor: FC<ICodeEditorProps> = (props) => {
	const [code, setCode] = useState<string>(props.initialValue || "");

	useEffect(() => {
		if(props.onChange) {
			props.onChange(code);
		}
	}, [code]);

	function onChange(text: string) {
		setCode(text);
	}

	function highlightSyntax() {
		if(!props.language) {
			return code;
		}

		const langs = {
			java: require("./langs/java"),
			javascript: require("./langs/javascript")
		};

		const { keywords, singleLineComments } = langs[props.language];

		const patterns: { pattern: RegExp; style: StyleProp<TextStyle>; }[] = [];

		if(singleLineComments) {
			patterns.push({ pattern: new RegExp(`(${singleLineComments.join("|")})(.*)$`, "gm"), style: { color: "grey" } });
		}

		if(keywords) {
			patterns.push({ pattern: new RegExp(keywords.join("|"), "g"), style: { color: "#7796CB" } });
		}

		return (
			<ParsedText
				parse={patterns}
				style={styles.syntax}
			>
				{code}
			</ParsedText>
		);
	}

	return (
		<ScrollView alwaysBounceVertical={false} style={styles.scrollView}>
			{highlightSyntax()}

			<TextInput
				autoCapitalize="none"
				autoCorrect={false}
				autoFocus={true}
				multiline={true}
				onChangeText={onChange}
				returnKeyType="next"
				spellCheck={false}
				style={styles.input}
				textAlignVertical="top"
				textContentType="none"
				value={code}
			/>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	input: {
		color: "transparent",
	},
	scrollView: {
		flex: 1
	},
	syntax: {
		position: "absolute",
		top: 0
	}
});

export default CodeEditor;
