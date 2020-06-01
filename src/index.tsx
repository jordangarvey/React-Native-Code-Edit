import React, { FC, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import Line from "./Line";


interface ICodeEditorProps {
	/** Optionally set the initial value of the editor */
	initialValue?: string[];
	/** Optional callback called with the current value of the editor */
	onChange?(value: string[]): any;
}

const CodeEditor: FC<ICodeEditorProps> = (props) => {
	const [lines, setLines] = useState<string[]>(props.initialValue || [""]);

	useEffect(() => {
		if(props.onChange) {
			props.onChange(lines);
		}
	}, [lines]);

	function onBackspace(lineNumber: number) {
		// TODO: this should be if the cursor is at index 0
		if(!lines[lineNumber]) {
			setLines(previousLines => {
				previousLines.splice(lineNumber, 1);

				return [...previousLines];
			})
		}
	}

	function onChange(text: string, lineNumber: number) {
		setLines(previousLines => {
			previousLines[lineNumber] = text;

			return [...previousLines];
		});
	}

	function onEnterPress(lineNumber: number) {
		setLines(previousLines => {
			previousLines.splice(lineNumber + 1, 0, "");

			return [...previousLines];
		});
	}

	return (
		<>
			<View style={styles.lineNumberBorder}/>

			<View style={styles.codeContainer}>
				{
					lines.map((line, index) => (
						<Line
							key={index}
							lineNumber={index}
							onBackspace={onBackspace}
							onChange={onChange}
							onEnterPress={onEnterPress}
							value={line}
						/>
					))
				}
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	codeContainer: {
		height: "100%",
		position: "absolute",
		width: "100%"
	},
	lineNumberBorder: {
		borderColor: "#000000",
		borderWidth: 0.5,
		height: "100%",
		left: 30,
		position: "absolute",
		width: 0
	}
});

export default CodeEditor;
