const assert = require("node:assert/strict");
const test = require("node:test");

const { tokenize } = require("../dist/highlight.js");
const { patternsFor, supportedLanguages } = require("../dist/langs/index.js");

/** The text of every run a pattern claimed, in order. */
function styled(tokens) {
	return tokens.filter((token) => token.style !== undefined).map((token) => token.text);
}

function join(tokens) {
	return tokens.map((token) => token.text).join("");
}

test("returns the source untouched when nothing matches", () => {
	const tokens = tokenize("hello world", patternsFor("javascript"));

	assert.deepEqual(tokens, [{ text: "hello world" }]);
});

test("returns no tokens for empty source", () => {
	assert.deepEqual(tokenize("", patternsFor("javascript")), []);
});

test("highlights keywords that stand alone", () => {
	const tokens = tokenize("const x = new Thing();", patternsFor("javascript"));

	assert.deepEqual(styled(tokens), ["const", "new"]);
});

test("does not highlight keywords buried inside identifiers", () => {
	// Regression: before word boundaries were added this matched `for` inside
	// `formatted`, `in` inside `printer` and `info`, and `do` inside `doing`.
	const source = "const formatted = printer.info; // doing work";
	const tokens = tokenize(source, patternsFor("javascript"));

	assert.deepEqual(styled(tokens), ["const", "// doing work"]);
});

test("gives a comment one run and leaves keywords inside it alone", () => {
	const tokens = tokenize("// return early\nreturn 1;", patternsFor("javascript"));

	assert.deepEqual(styled(tokens), ["// return early", "return"]);
});

test("ends a comment at the newline, not the end of the source", () => {
	const tokens = tokenize("a // one\nb // two\nc", patternsFor("javascript"));

	assert.deepEqual(styled(tokens), ["// one", "// two"]);
});

test("preserves the source exactly when tokens are rejoined", () => {
	const source = [
		"// Adds two numbers",
		"function add(a, b) {",
		"\treturn a + b; // sum",
		"}"
	].join("\n");

	assert.equal(join(tokenize(source, patternsFor("javascript"))), source);
});

test("treats java as its own language", () => {
	const tokens = tokenize("public class Main {}", patternsFor("java"));

	assert.deepEqual(styled(tokens), ["public", "class"]);
});

test("terminates on a pattern that can match nothing", () => {
	// A zero-width match never advances lastIndex on its own; the tokenizer has
	// to nudge it or this hangs forever.
	const tokens = tokenize("abc", [{ pattern: /x*/g, style: { color: "red" } }]);

	assert.equal(join(tokens), "abc");
});

test("lets the first matching pattern claim a run", () => {
	const patterns = [
		{ pattern: /ab/g, style: { color: "first" } },
		{ pattern: /b/g, style: { color: "second" } }
	];
	const tokens = tokenize("ab", patterns);

	assert.deepEqual(tokens, [{ text: "ab", style: { color: "first" } }]);
});

test("copes with a pattern that is missing the global flag", () => {
	const tokens = tokenize("a a a", [{ pattern: /a/, style: { color: "red" } }]);

	assert.deepEqual(styled(tokens), ["a", "a", "a"]);
});

test("every supported language builds usable patterns", () => {
	assert.ok(supportedLanguages.length > 0);

	for(const language of supportedLanguages) {
		const patterns = patternsFor(language);

		assert.ok(patterns.length > 0, `${language} produced no patterns`);

		for(const { pattern } of patterns) {
			assert.ok(pattern instanceof RegExp);
		}
	}
});
