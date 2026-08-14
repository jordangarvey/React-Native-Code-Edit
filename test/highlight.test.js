const assert = require("node:assert/strict");
const test = require("node:test");

const { tokenize } = require("../dist/highlight.js");
const { rulesFor, supportedLanguages } = require("../dist/langs/index.js");

/** The text of every run tagged with `type`, in order. */
function ofType(tokens, type) {
	return tokens.filter((token) => token.type === type).map((token) => token.text);
}

function join(tokens) {
	return tokens.map((token) => token.text).join("");
}

function run(source, language = "javascript") {
	return tokenize(source, rulesFor(language));
}

test("returns nothing for empty source", () => {
	assert.deepEqual(run(""), []);
});

test("leaves unremarkable text as one plain run", () => {
	assert.deepEqual(run("hello world"), [{ text: "hello world", type: "plain" }]);
});

test("highlights keywords that stand alone", () => {
	assert.deepEqual(ofType(run("const x = new Thing();"), "keyword"), ["const", "new"]);
});

test("does not highlight keywords buried inside identifiers", () => {
	// Regression: "for" once matched inside "formatted", and "in" twice inside
	// "printer" and "info".
	const tokens = run("const formatted = printer.info;");

	assert.deepEqual(ofType(tokens, "keyword"), ["const"]);
});

test("prefers the longest keyword at a position", () => {
	assert.deepEqual(ofType(run("a instanceof B"), "keyword"), ["instanceof"]);
});

test("does not highlight keywords inside a string", () => {
	// Regression: the keyword rule used to reach inside string literals.
	const tokens = run("const s = \"for the win\";");

	assert.deepEqual(ofType(tokens, "keyword"), ["const"]);
	assert.deepEqual(ofType(tokens, "string"), ["\"for the win\""]);
});

test("does not start a comment at a // inside a string", () => {
	// Regression: this used to swallow the rest of the line as a comment.
	const tokens = run("const url = \"https://x.com\";");

	assert.deepEqual(ofType(tokens, "comment"), []);
	assert.deepEqual(ofType(tokens, "string"), ["\"https://x.com\""]);
});

test("does start a comment at a // outside a string", () => {
	const tokens = run("call(); // \"not a string\"");

	assert.deepEqual(ofType(tokens, "comment"), ["// \"not a string\""]);
	assert.deepEqual(ofType(tokens, "string"), []);
});

test("highlights block comments and nothing inside them", () => {
	// Regression: block comments were not recognised at all, so "return" inside
	// one was highlighted as a keyword.
	const tokens = run("/* return early */ x();");

	assert.deepEqual(ofType(tokens, "comment"), ["/* return early */"]);
	assert.deepEqual(ofType(tokens, "keyword"), []);
});

test("lets a block comment span lines", () => {
	const tokens = run("/*\n multi\n line\n*/\nconst x = 1;");

	assert.deepEqual(ofType(tokens, "comment"), ["/*\n multi\n line\n*/"]);
	assert.deepEqual(ofType(tokens, "keyword"), ["const"]);
});

test("highlights numbers", () => {
	assert.deepEqual(ofType(run("const n = 42 + 3.5 + 0xFF;"), "number"), ["42", "3.5", "0xFF"]);
});

test("does not treat digits inside identifiers as numbers", () => {
	assert.deepEqual(ofType(run("const sha256 = 1;"), "number"), ["1"]);
});

test("keeps escaped quotes inside a string", () => {
	assert.deepEqual(ofType(run("const s = \"a\\\"b\";"), "string"), ["\"a\\\"b\""]);
});

test("ends an unterminated string at the line break", () => {
	const tokens = run("const s = \"oops\nconst t = 1;");

	assert.deepEqual(ofType(tokens, "string"), ["\"oops"]);
	assert.deepEqual(ofType(tokens, "keyword"), ["const", "const"]);
});

test("runs an unterminated block comment to the end of the source", () => {
	assert.deepEqual(ofType(run("x(); /* oops\nconst y = 1;"), "comment"), ["/* oops\nconst y = 1;"]);
});

test("treats a template literal as one string across lines", () => {
	assert.deepEqual(ofType(run("const t = `a\nb`;"), "string"), ["`a\nb`"]);
});

test("comments out the rest of the line in python", () => {
	const tokens = run("x = 1 # def not a keyword", "python");

	assert.deepEqual(ofType(tokens, "comment"), ["# def not a keyword"]);
	assert.deepEqual(ofType(tokens, "keyword"), []);
});

test("takes a python triple quote whole", () => {
	// A greedy single-quote rule would read this as an empty string first.
	const tokens = run("s = \"\"\"a\nb\"\"\"", "python");

	assert.deepEqual(ofType(tokens, "string"), ["\"\"\"a\nb\"\"\""]);
});

test("highlights java block comments and strings", () => {
	const tokens = run("/* note */ String s = \"public\";", "java");

	assert.deepEqual(ofType(tokens, "comment"), ["/* note */"]);
	assert.deepEqual(ofType(tokens, "string"), ["\"public\""]);
	assert.deepEqual(ofType(tokens, "keyword"), []);
});

test("highlights json literals without treating # as a comment", () => {
	const tokens = run("{ \"a\": true, \"b\": 1, \"c\": \"# not a comment\" }", "json");

	assert.deepEqual(ofType(tokens, "keyword"), ["true"]);
	assert.deepEqual(ofType(tokens, "number"), ["1"]);
	assert.deepEqual(ofType(tokens, "comment"), []);
});

test("highlights typescript type keywords", () => {
	assert.deepEqual(ofType(run("interface A { b: string }", "typescript"), "keyword"), ["interface", "string"]);
});

test("terminates on a rule that can match nothing", () => {
	const tokens = tokenize("abc", [{ type: "keyword", pattern: /x*/g }]);

	assert.equal(join(tokens), "abc");
});

test("settles rules that match at the same place by their order", () => {
	const rules = [
		{ type: "comment", pattern: /ab/g },
		{ type: "keyword", pattern: /a/g }
	];

	assert.deepEqual(tokenize("ab", rules), [{ text: "ab", type: "comment" }]);
});

test("prefers whichever rule matches earliest, not whichever is listed first", () => {
	const rules = [
		{ type: "comment", pattern: /b/g },
		{ type: "keyword", pattern: /a/g }
	];

	assert.deepEqual(tokenize("ab", rules), [
		{ text: "a", type: "keyword" },
		{ text: "b", type: "comment" }
	]);
});

test("copes with a rule that is missing the global flag", () => {
	const tokens = tokenize("a a a", [{ type: "keyword", pattern: /a/ }]);

	assert.deepEqual(ofType(tokens, "keyword"), ["a", "a", "a"]);
});

test("preserves the source exactly when tokens are rejoined", () => {
	const source = [
		"/* Adds two numbers */",
		"function add(a, b) {",
		"\treturn a + b; // sum \"quoted\"",
		"}",
		"const msg = `total: ${add(1, 2)}`;"
	].join("\n");

	assert.equal(join(run(source)), source);
});

test("preserves any source in any language when tokens are rejoined", () => {
	// The invariant that matters most: highlighting must never lose, duplicate
	// or reorder a character, whatever it is handed.
	const alphabet = [..."abc {}();=+.#\n\t01", "\"", "'", "`", "/", "*", "\\"];
	let seed = 7;
	const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

	for(const language of supportedLanguages) {
		const rules = rulesFor(language);

		for(let attempt = 0; attempt < 200; attempt++) {
			let source = "";

			for(let index = 0; index < 60; index++) {
				source += alphabet[Math.floor(random() * alphabet.length)];
			}

			assert.equal(join(tokenize(source, rules)), source, `${language}: ${JSON.stringify(source)}`);
		}
	}
});

test("every supported language builds usable rules", () => {
	assert.ok(supportedLanguages.length > 0);

	for(const language of supportedLanguages) {
		const rules = rulesFor(language);

		assert.ok(rules.length > 0, `${language} produced no rules`);

		for(const { pattern, type } of rules) {
			assert.ok(pattern instanceof RegExp);
			assert.ok(["comment", "keyword", "number", "string"].includes(type));
		}
	}
});
