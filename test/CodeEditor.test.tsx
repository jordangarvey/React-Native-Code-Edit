import { createRef } from "react";
import { Platform, StyleSheet } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import CodeEditor, { themes, type CodeEditorHandle } from "../src/index";

/** Taken from `screen` so the ESM-only test-renderer types stay out of the way. */
type TestInstance = NonNullable<typeof screen.root>;

function hostsOfType(type: string): TestInstance[] {
	const root = screen.root;

	if(root === null) {
		throw new Error("nothing rendered");
	}

	return root.queryAll((node) => node.type === type);
}

/** The editable layer. */
function input(): TestInstance {
	const found = hostsOfType("TextInput");

	expect(found).toHaveLength(1);

	return found[0]!;
}

/** The outermost Text, which holds the highlighted copy of the code. */
function highlight(): TestInstance {
	const found = hostsOfType("Text");

	expect(found.length).toBeGreaterThan(0);

	return found[0]!;
}

/** The scrolling container, which is the root the editor renders. */
function container(): TestInstance {
	const root = screen.root;

	if(root === null) {
		throw new Error("nothing rendered");
	}

	expect(root.type).toBe("RCTScrollView");

	return root;
}

function flatten(node: TestInstance): TextStyle & ViewStyle {
	return StyleSheet.flatten(node.props.style) ?? {};
}

/** Each highlighted run, paired with the colour it was painted. */
function runs(): { text: string; color: string | undefined }[] {
	return hostsOfType("Text")
		.slice(1)
		.map((node) => ({
			text: node.children.filter((child) => typeof child === "string").join(""),
			color: flatten(node).color as string | undefined
		}));
}

describe("value handling", () => {
	it("renders the initial value", async () => {
		await render(<CodeEditor initialValue="const x = 1;" />);

		expect(input().props.value).toBe("const x = 1;");
	});

	it("starts empty when given nothing", async () => {
		await render(<CodeEditor />);

		expect(input().props.value).toBe("");
	});

	it("does not report a change on mount", async () => {
		// Regression: onChange used to fire once during the first render, which
		// made it impossible to tell a real edit from mounting.
		const onChange = jest.fn();

		await render(<CodeEditor initialValue="const x = 1;" onChange={onChange} />);

		expect(onChange).not.toHaveBeenCalled();
	});

	it("keeps and reports edits when uncontrolled", async () => {
		const onChange = jest.fn();

		await render(<CodeEditor initialValue="a" onChange={onChange} />);
		await fireEvent.changeText(input(), "ab");

		expect(onChange).toHaveBeenCalledWith("ab");
		expect(input().props.value).toBe("ab");
	});

	it("reports edits but holds its value when controlled", async () => {
		const onChange = jest.fn();

		await render(<CodeEditor value="a" onChange={onChange} />);
		await fireEvent.changeText(input(), "ab");

		expect(onChange).toHaveBeenCalledWith("ab");
		// The parent ignored the change, so the editor must not move on its own.
		expect(input().props.value).toBe("a");
	});

	it("follows the value its parent gives it", async () => {
		const view = await render(<CodeEditor value="a" />);

		await view.rerender(<CodeEditor value="b" />);

		expect(input().props.value).toBe("b");
	});

	it("ignores initialValue once value is supplied", async () => {
		await render(<CodeEditor initialValue="ignored" value="used" />);

		expect(input().props.value).toBe("used");
	});
});

describe("highlighting", () => {
	it("paints runs with the theme colours", async () => {
		await render(<CodeEditor language="javascript" initialValue="const n = 1; // hi" theme="dark" />);

		expect(runs()).toEqual([
			{ text: "const", color: themes.dark.keyword },
			{ text: " n = ", color: themes.dark.plain },
			{ text: "1", color: themes.dark.number },
			{ text: "; ", color: themes.dark.plain },
			{ text: "// hi", color: themes.dark.comment }
		]);
	});

	it("leaves the code unbroken when no language is given", async () => {
		await render(<CodeEditor initialValue="const x = 1;" />);

		// No tokens, so the text sits directly in the highlight layer.
		expect(runs()).toEqual([]);
		expect(highlight().children).toEqual(["const x = 1;"]);
	});

	it("re-highlights as the code changes", async () => {
		await render(<CodeEditor language="javascript" initialValue="const" />);
		await fireEvent.changeText(input(), "return");

		expect(runs()).toEqual([{ text: "return", color: themes.light.keyword }]);
	});
});

describe("theming", () => {
	it("uses the light theme by default", async () => {
		await render(<CodeEditor />);

		expect(flatten(container()).backgroundColor).toBe(themes.light.background);
	});

	it("accepts a built-in theme by name", async () => {
		await render(<CodeEditor theme="dark" />);

		expect(flatten(container()).backgroundColor).toBe(themes.dark.background);
	});

	it("accepts a custom theme", async () => {
		const theme = { ...themes.dark, background: "#000000", keyword: "#FF7B72" };

		await render(<CodeEditor language="javascript" initialValue="const" theme={theme} />);

		expect(flatten(container()).backgroundColor).toBe("#000000");
		expect(runs()).toEqual([{ text: "const", color: "#FF7B72" }]);
	});

	it("colours the caret from the theme", async () => {
		// The input's own text is transparent, so without this the caret is
		// whatever the platform picks and can be invisible.
		await render(<CodeEditor theme="dark" />);

		expect(input().props.selectionColor).toBe(themes.dark.caret);
		expect(flatten(input()).color).toBe("transparent");
	});
});

describe("layer alignment", () => {
	// The caret sits in one layer and the colour in the other. The moment their
	// metrics disagree the caret drifts away from the text underneath it.
	const metrics = ["fontFamily", "fontSize", "lineHeight", "padding"] as const;

	it("gives both layers identical metrics by default", async () => {
		await render(<CodeEditor language="javascript" initialValue="const x = 1;" />);

		const inputStyle = flatten(input());
		const highlightStyle = flatten(highlight());

		for(const metric of metrics) {
			expect(inputStyle[metric]).toBeDefined();
			expect(inputStyle[metric]).toEqual(highlightStyle[metric]);
		}
	});

	it("applies custom metrics to both layers", async () => {
		await render(
			<CodeEditor fontSize={20} fontFamily="Courier" lineHeight={33} padding={4} />
		);

		for(const style of [flatten(input()), flatten(highlight())]) {
			expect(style.fontSize).toBe(20);
			expect(style.fontFamily).toBe("Courier");
			expect(style.lineHeight).toBe(33);
			expect(style.padding).toBe(4);
		}
	});

	it("derives line height from font size when not given", async () => {
		await render(<CodeEditor fontSize={20} />);

		expect(flatten(input()).lineHeight).toBe(30);
	});

	it("defaults to a font the current platform actually ships", async () => {
		// Menlo is present on iOS; Android resolves "monospace" itself. Getting
		// this wrong falls back to a proportional font, and code stops lining up.
		await render(<CodeEditor />);

		const expected = Platform.OS === "ios" ? "Menlo" : "monospace";

		expect(flatten(input()).fontFamily).toBe(expected);
		expect(flatten(highlight()).fontFamily).toBe(expected);
	});
});

describe("readOnly", () => {
	it("refuses edits", async () => {
		await render(<CodeEditor value="const x = 1;" readOnly />);

		expect(input().props.editable).toBe(false);
	});

	it("does not grab focus", async () => {
		await render(<CodeEditor readOnly />);

		expect(input().props.autoFocus).toBe(false);
	});

	it("can still be told to focus", async () => {
		await render(<CodeEditor readOnly autoFocus />);

		expect(input().props.autoFocus).toBe(true);
	});

	it("is editable and focused by default", async () => {
		await render(<CodeEditor />);

		expect(input().props.editable).toBe(true);
		expect(input().props.autoFocus).toBe(true);
	});
});

describe("ref handle", () => {
	it("exposes focus, blur and clear", async () => {
		const ref = createRef<CodeEditorHandle>();

		await render(<CodeEditor ref={ref} />);

		expect(typeof ref.current?.focus).toBe("function");
		expect(typeof ref.current?.blur).toBe("function");
		expect(typeof ref.current?.clear).toBe("function");
	});

	it("forwards focus and blur to the input", async () => {
		// The test renderer does not track focus, so this checks only that the
		// handle reaches the input and leaves it intact. Whether the keyboard
		// actually appears is a device concern.
		const ref = createRef<CodeEditorHandle>();

		await render(<CodeEditor ref={ref} initialValue="const x = 1;" autoFocus={false} />);

		await act(async () => ref.current?.focus());
		await act(async () => ref.current?.blur());

		expect(input().props.value).toBe("const x = 1;");
	});

	it("empties an uncontrolled editor and reports it", async () => {
		const onChange = jest.fn();
		const ref = createRef<CodeEditorHandle>();

		await render(<CodeEditor ref={ref} initialValue="const x = 1;" onChange={onChange} />);
		await act(async () => ref.current?.clear());

		expect(input().props.value).toBe("");
		expect(onChange).toHaveBeenCalledWith("");
	});

	it("asks the parent to empty a controlled editor rather than doing it", async () => {
		const onChange = jest.fn();
		const ref = createRef<CodeEditorHandle>();

		await render(<CodeEditor ref={ref} value="const x = 1;" onChange={onChange} />);
		await act(async () => ref.current?.clear());

		expect(onChange).toHaveBeenCalledWith("");
		expect(input().props.value).toBe("const x = 1;");
	});
});

describe("inputProps", () => {
	it("passes extra props to the input", async () => {
		await render(<CodeEditor inputProps={{ testID: "editor", placeholder: "type here" }} />);

		expect(input().props.testID).toBe("editor");
		expect(input().props.placeholder).toBe("type here");
	});

	it("lets the caret colour be overridden", async () => {
		await render(<CodeEditor inputProps={{ selectionColor: "#FF0000" }} />);

		expect(input().props.selectionColor).toBe("#FF0000");
	});

	it("cannot clobber the props the editor owns", async () => {
		const onChange = jest.fn();

		await render(
			<CodeEditor
				value="mine"
				onChange={onChange}
				inputProps={
					{
						value: "theirs",
						editable: false,
						multiline: false,
						onChangeText: jest.fn()
					} as never
				}
			/>
		);

		expect(input().props.value).toBe("mine");
		expect(input().props.editable).toBe(true);
		expect(input().props.multiline).toBe(true);

		await fireEvent.changeText(input(), "edited");
		expect(onChange).toHaveBeenCalledWith("edited");
	});
});

describe("container style", () => {
	it("accepts a style that can override the theme background", async () => {
		await render(<CodeEditor theme="dark" style={{ backgroundColor: "#123456" }} />);

		expect(flatten(container()).backgroundColor).toBe("#123456");
	});
});
