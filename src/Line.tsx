giimport React, { FC } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";


interface ILineProps {
	lineNumber: number;
	onBackspace(lineNumber: number): void;
	onChange(text: string, lineNumber: number): void;
	onEnterPress(lineNumber: number): void;
	value: string;
}

const Line: FC<ILineProps> = (props) => {
	function onChange(text: string) {
		props.onChange(text, props.lineNumber);
	}

	function onEnter(event: any) {
		event.preventDefault();

		props.onEnterPress(props.lineNumber);
	}

	function onKeyPress(event: any) {
		if(event.nativeEvent.key === "Backspace") {
			props.onBackspace(props.lineNumber);
		}
	}

	return (
		<View style={styles.line}>
			<Text style={styles.lineNumber}>{props.lineNumber}</Text>
			<TextInput
				autoFocus={true}
				multiline={true}
				onChangeText={onChange}
				onKeyPress={onKeyPress}
				onSubmitEditing={onEnter}
				returnKeyType="next"
				spellCheck={false}
				style={styles.input}
				textAlignVertical="top"
				textContentType="none"
				value={props.value}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	line: {
		position: "relative",
		top: 0
	},
	lineNumber: {
		left: 10
	},
	input: {
		left: 50,
		position: "absolute",
		right: 0
	}
});

export default Line;
