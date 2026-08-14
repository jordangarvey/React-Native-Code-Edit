import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import CodeEditor, { supportedLanguages, themes } from "react-native-code-edit";
import type { Language, ThemeName } from "react-native-code-edit";

/**
 * Each sample leads with the cases that were highlighted wrongly before 1.0.0,
 * so a glance at the simulator is enough to tell whether they are still fixed.
 */
const samples: Record<Language, string> = {
	javascript: `// A URL in a string must not comment out the line
const url = "https://example.com/api";
const message = "for the win";
/* return early */
const answer = 42;

function greet(name) {
	return \`hello \${name}\`;
}`,
	typescript: `interface User {
	name: string;
	age: number;
}

const parse = (raw: string): User => JSON.parse(raw);
export default parse;`,
	java: `/* A block comment */
public class Main {
	public static void main(String[] args) {
		String url = "https://example.com";
		int answer = 42;
		System.out.println(url);
	}
}`,
	python: `"""Docstrings span lines."""
import sys


def greet(name):
	# "for" must not light up in here
	message = f"hello {name}"
	return message, 42`,
	json: `{
	"name": "react-native-code-edit",
	"version": "1.0.0",
	"private": false,
	"note": "# not a comment, // also not a comment",
	"count": 42
}`
};

export default function App() {
	const [language, setLanguage] = useState<Language>("javascript");
	const [themeName, setThemeName] = useState<ThemeName>("light");
	const [readOnly, setReadOnly] = useState(false);
	const [code, setCode] = useState(samples.javascript);

	const theme = themes[themeName];

	function pickLanguage(next: Language) {
		setLanguage(next);
		setCode(samples[next]);
	}

	return (
		<SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
			<View style={styles.controls}>
				{supportedLanguages.map((option) => (
					<Chip
						key={option}
						label={option}
						selected={option === language}
						theme={theme}
						onPress={() => pickLanguage(option)}
					/>
				))}
			</View>

			<View style={styles.controls}>
				<Chip
					label={themeName === "light" ? "light" : "dark"}
					selected
					theme={theme}
					onPress={() => setThemeName(themeName === "light" ? "dark" : "light")}
				/>
				<Chip
					label={readOnly ? "read only" : "editable"}
					selected={readOnly}
					theme={theme}
					onPress={() => setReadOnly(!readOnly)}
				/>
				<Text style={[styles.count, { color: theme.comment }]}>
					{code.length} chars
				</Text>
			</View>

			<CodeEditor
				language={language}
				value={code}
				onChange={setCode}
				theme={theme}
				readOnly={readOnly}
				autoFocus={false}
				style={styles.editor}
			/>
		</SafeAreaView>
	);
}

interface ChipProps {
	label: string;
	selected: boolean;
	theme: (typeof themes)[ThemeName];
	onPress(): void;
}

function Chip({ label, selected, theme, onPress }: ChipProps) {
	return (
		<Pressable
			onPress={onPress}
			style={[
				styles.chip,
				{ borderColor: theme.comment },
				selected && { backgroundColor: theme.keyword, borderColor: theme.keyword }
			]}
		>
			<Text style={{ color: selected ? theme.background : theme.plain }}>{label}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1
	},
	controls: {
		alignItems: "center",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		paddingHorizontal: 12,
		paddingTop: 12
	},
	chip: {
		borderRadius: 6,
		borderWidth: 1,
		paddingHorizontal: 10,
		paddingVertical: 6
	},
	count: {
		marginLeft: "auto"
	},
	editor: {
		marginTop: 12
	}
});
