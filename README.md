# react-native-code-edit

A lightweight code editor for React Native, with syntax highlighting and no runtime dependencies.

It works by stacking a transparent `TextInput` over a highlighted copy of the same text, so you get native text editing — the real keyboard, the real caret, the real selection handles — with colour underneath. There is no WebView and no native module, so nothing to link and nothing to rebuild.

## Install

```sh
npm install react-native-code-edit
```

`react` and `react-native` are peer dependencies, so you keep the versions your app already uses.

## Usage

Uncontrolled, with a callback when the text changes:

```tsx
import CodeEditor from "react-native-code-edit";

export function Editor() {
	return (
		<CodeEditor
			language="javascript"
			initialValue="const greeting = 'hello';"
			onChange={(code) => console.log(code)}
		/>
	);
}
```

Controlled, when you want to own the text yourself:

```tsx
import { useState } from "react";
import CodeEditor from "react-native-code-edit";

export function Editor() {
	const [code, setCode] = useState("const greeting = 'hello';");

	return <CodeEditor language="javascript" value={code} onChange={setCode} />;
}
```

Pass `value` and the editor renders exactly what you give it, so remember to feed `onChange` back into state or typing will appear to do nothing.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `language` | `"java" \| "javascript"` | — | Language to highlight. Omit for plain, uncoloured text. |
| `initialValue` | `string` | `""` | Starting contents. Read on first render only, and ignored when `value` is set. |
| `value` | `string` | — | Contents of the editor. Passing this makes the editor controlled. |
| `onChange` | `(value: string) => void` | — | Called with the new contents on every edit. |
| `autoFocus` | `boolean` | `true` | Whether to focus the editor, and raise the keyboard, on mount. |

## Supported languages

`java` and `javascript`. Highlighting covers keywords and single-line comments.

`supportedLanguages` is exported if you need the list at runtime:

```ts
import { supportedLanguages } from "react-native-code-edit";
```

## Requirements

Verified against React Native 0.71 through 0.87, on React 18 and 19. Being pure JavaScript, it has no opinion about your Xcode version and works on both the old and new architectures.

## Upgrading from 0.x

1.0.0 keeps the same component and the same `language` / `initialValue` / `onChange` props, so most code needs no changes. Four things did change:

- **`react` and `react-native` moved to peer dependencies.** Previously they were listed as regular dependencies, which pulled a second copy of React 16 and React Native 0.62 into your app. If you pinned around that, you can stop.
- **`onChange` no longer fires on mount.** It used to be called once during the first render with the initial value. It is now only called in response to an actual edit. If you relied on the old behaviour, call your handler yourself alongside `initialValue`.
- **Text is now rendered in a monospace font at a fixed size.** Both layers need identical metrics or the caret drifts away from the highlighted text as lines grow; setting them is what keeps the two aligned.
- **`react-native-parsed-text` is gone.** The text-splitting it provided is now internal, so the package has no runtime dependencies at all.

## Licence

MIT © Jordan Garvey
