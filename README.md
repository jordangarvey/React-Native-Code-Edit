# react-native-code-edit

A lightweight code editor for React Native, with syntax highlighting and no runtime dependencies.

It stacks a transparent `TextInput` over a highlighted copy of the same text, so you get native text editing — the real keyboard, the real caret, the real selection handles — with colour underneath. There is no WebView and no native module, so nothing to link and nothing to rebuild.

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

	return <CodeEditor language="javascript" value={code} onChange={setCode} theme="dark" />;
}
```

Pass `value` and the editor renders exactly what you give it, so remember to feed `onChange` back into state or typing will appear to do nothing.

Read-only, for showing a snippet:

```tsx
<CodeEditor language="python" value={snippet} readOnly />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `language` | `Language` | — | Language to highlight. Omit for plain, uncoloured text. |
| `initialValue` | `string` | `""` | Starting contents. Read on first render only, and ignored when `value` is set. |
| `value` | `string` | — | Contents of the editor. Passing this makes the editor controlled. |
| `onChange` | `(value: string) => void` | — | Called with the new contents on every edit. |
| `theme` | `"light" \| "dark" \| CodeEditorTheme` | `"light"` | A built-in theme, or your own colours. |
| `readOnly` | `boolean` | `false` | Render the code but refuse edits. |
| `autoFocus` | `boolean` | `true` unless `readOnly` | Whether to focus the editor, and raise the keyboard, on mount. |
| `fontSize` | `number` | `14` | |
| `fontFamily` | `string` | `Menlo` on iOS, `monospace` elsewhere | |
| `lineHeight` | `number` | `1.5 × fontSize` | |
| `padding` | `number` | `12` | |
| `style` | `StyleProp<ViewStyle>` | — | Style for the scrolling container. |
| `inputProps` | `TextInputProps` | — | Escape hatch onto the underlying `TextInput`. |

Metrics are props rather than a style object on purpose: both text layers have to be laid out identically, and the caret drifts away from the highlighted text as soon as they disagree. Setting them here applies them to both.

`inputProps` accepts anything `TextInput` does except the handful the editor sets itself — `value`, `onChangeText`, `style`, `editable`, `multiline` and `autoFocus`.

## Ref

```tsx
const editor = useRef<CodeEditorHandle>(null);

editor.current?.focus();
editor.current?.blur();
editor.current?.clear();
```

## Themes

`theme` takes `"light"`, `"dark"`, or an object:

```tsx
import CodeEditor, { themes } from "react-native-code-edit";

<CodeEditor theme={{ ...themes.dark, keyword: "#FF7B72", background: "#000000" }} />
```

A theme sets `background`, `plain`, `keyword`, `comment`, `string`, `number`, and `caret` — the last one matters because the input's own text is transparent, so without it the caret is whatever the platform picks and can be invisible.

## Languages

`java`, `javascript`, `json`, `python` and `typescript`. Highlighting covers keywords, line and block comments, strings and numbers.

```ts
import { supportedLanguages } from "react-native-code-edit";
```

Highlighting is lexical, not a parser: it recognises the shape of tokens, not their meaning. A word that is a keyword somewhere is highlighted everywhere it stands alone, and TypeScript's `type` or `string` will colour even when used as an identifier.

The tokenizer is exported if you want to render code yourself:

```ts
import { tokenize, rulesFor } from "react-native-code-edit";

const tokens = tokenize("const x = 1;", rulesFor("javascript"));
// [{ text: "const", type: "keyword" }, { text: " x = ", type: "plain" }, ...]
```

## Scale

The whole document is re-highlighted on each keystroke. That costs well under a millisecond for a few hundred lines and a couple of milliseconds at two thousand, so it is comfortable for snippets and files of moderate size. Very large documents are limited less by highlighting than by the number of `Text` nodes React Native has to lay out — if you are editing thousands of lines on a phone, a WebView-based editor will serve you better.

Line numbers are deliberately absent. Long lines wrap, and a wrapped line makes a gutter drift out of step with the text beside it; a gutter that is sometimes wrong is worse than none.

## Requirements

Verified against React Native 0.71 through 0.87, on React 18 and 19. Being pure JavaScript, it has no opinion about your Xcode version and works on both the old and new architectures.

## Development

```sh
npm install
npm test          # Jest, unit and component tests
npm run typecheck # source and tests
npm run build     # what gets published
```

`npm run test:watch` reruns on change, and `npm run test:coverage` writes a report. All three commands run in CI on every push and pull request.

The suite runs twice, once per platform, so the iOS and Android paths are both exercised.

To try it on a simulator, `example/` is an Expo app wired to the local source:

```sh
cd example && npm install && npm run ios
```

It needs no `pod install` and no prebuild, because the library has no native code. See [example/README.md](example/README.md) for what is worth checking there.

Component tests use [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) on top of `@react-native/jest-preset`. Note that Jest is pinned to 29 rather than 30: React Native 0.87's preset still depends on the Jest 29 environment packages, and mixing the two breaks the runtime.

## Upgrading from 0.x

The component and the `language` / `initialValue` / `onChange` props work as they did, so most code needs no changes. What changed:

- **`react` and `react-native` moved to peer dependencies.** Previously they were regular dependencies, which pulled a second copy of React 16 and React Native 0.62 into your app. If you pinned around that, you can stop.
- **`onChange` no longer fires on mount.** It used to be called once during the first render with the initial value. It is now only called in response to an actual edit.
- **Text is rendered in a monospace font at a fixed size**, adjustable through the metric props above. Both layers need identical metrics or the caret drifts.
- **Highlighting is much less eager.** Keywords inside strings and comments are no longer coloured, `//` inside a string no longer comments out the rest of the line, and block comments, strings and numbers are recognised. Colour now comes from the theme rather than being hardcoded.
- **`react-native-parsed-text` is gone.** The text splitting it provided is now internal, so the package has no runtime dependencies at all.

## Licence

MIT © Jordan Garvey
