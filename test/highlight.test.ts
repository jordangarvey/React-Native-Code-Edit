import { tokenize, type HighlightRule, type Token, type TokenType } from "../src/highlight";
import { rulesFor, supportedLanguages, type Language } from "../src/langs";

/** The text of every run tagged with `type`, in order. */
function ofType(tokens: Token[], type: TokenType): string[] {
	return tokens.filter((token) => token.type === type).map((token) => token.text);
}

function join(tokens: Token[]): string {
	return tokens.map((token) => token.text).join("");
}

function run(source: string, language: Language = "javascript"): Token[] {
	return tokenize(source, rulesFor(language));
}

describe("tokenize", () => {
	it("returns nothing for empty source", () => {
		expect(run("")).toEqual([]);
	});

	it("leaves unremarkable text as one plain run", () => {
		expect(run("hello world")).toEqual([{ text: "hello world", type: "plain" }]);
	});

	it("terminates on a rule that can match nothing", () => {
		const rules: HighlightRule[] = [{ type: "keyword", pattern: /x*/g }];

		expect(join(tokenize("abc", rules))).toBe("abc");
	});

	it("settles rules that match at the same place by their order", () => {
		const rules: HighlightRule[] = [
			{ type: "comment", pattern: /ab/g },
			{ type: "keyword", pattern: /a/g }
		];

		expect(tokenize("ab", rules)).toEqual([{ text: "ab", type: "comment" }]);
	});

	it("prefers whichever rule matches earliest, not whichever is listed first", () => {
		const rules: HighlightRule[] = [
			{ type: "comment", pattern: /b/g },
			{ type: "keyword", pattern: /a/g }
		];

		expect(tokenize("ab", rules)).toEqual([
			{ text: "a", type: "keyword" },
			{ text: "b", type: "comment" }
		]);
	});

	it("copes with a rule that is missing the global flag", () => {
		const rules: HighlightRule[] = [{ type: "keyword", pattern: /a/ }];

		expect(ofType(tokenize("a a a", rules), "keyword")).toEqual(["a", "a", "a"]);
	});
});

describe("keywords", () => {
	it("highlights keywords that stand alone", () => {
		expect(ofType(run("const x = new Thing();"), "keyword")).toEqual(["const", "new"]);
	});

	it("does not highlight keywords buried inside identifiers", () => {
		// Regression: "for" once matched inside "formatted", and "in" twice
		// inside "printer" and "info".
		expect(ofType(run("const formatted = printer.info;"), "keyword")).toEqual(["const"]);
	});

	it("prefers the longest keyword at a position", () => {
		expect(ofType(run("a instanceof B"), "keyword")).toEqual(["instanceof"]);
	});
});

describe("strings and comments do not leak into each other", () => {
	it("does not highlight keywords inside a string", () => {
		// Regression: the keyword rule used to reach inside string literals.
		const tokens = run("const s = \"for the win\";");

		expect(ofType(tokens, "keyword")).toEqual(["const"]);
		expect(ofType(tokens, "string")).toEqual(["\"for the win\""]);
	});

	it("does not start a comment at a // inside a string", () => {
		// Regression: this used to swallow the rest of the line as a comment.
		const tokens = run("const url = \"https://x.com\";");

		expect(ofType(tokens, "comment")).toEqual([]);
		expect(ofType(tokens, "string")).toEqual(["\"https://x.com\""]);
	});

	it("does start a comment at a // outside a string", () => {
		const tokens = run("call(); // \"not a string\"");

		expect(ofType(tokens, "comment")).toEqual(["// \"not a string\""]);
		expect(ofType(tokens, "string")).toEqual([]);
	});

	it("highlights block comments and nothing inside them", () => {
		// Regression: block comments were unrecognised, so "return" inside one
		// was highlighted as a keyword.
		const tokens = run("/* return early */ x();");

		expect(ofType(tokens, "comment")).toEqual(["/* return early */"]);
		expect(ofType(tokens, "keyword")).toEqual([]);
	});

	it("lets a block comment span lines", () => {
		const tokens = run("/*\n multi\n line\n*/\nconst x = 1;");

		expect(ofType(tokens, "comment")).toEqual(["/*\n multi\n line\n*/"]);
		expect(ofType(tokens, "keyword")).toEqual(["const"]);
	});
});

describe("literals", () => {
	it("highlights numbers", () => {
		expect(ofType(run("const n = 42 + 3.5 + 0xFF;"), "number")).toEqual(["42", "3.5", "0xFF"]);
	});

	it("does not treat digits inside identifiers as numbers", () => {
		expect(ofType(run("const sha256 = 1;"), "number")).toEqual(["1"]);
	});

	it("keeps escaped quotes inside a string", () => {
		expect(ofType(run("const s = \"a\\\"b\";"), "string")).toEqual(["\"a\\\"b\""]);
	});

	it("treats a template literal as one string across lines", () => {
		expect(ofType(run("const t = `a\nb`;"), "string")).toEqual(["`a\nb`"]);
	});
});

describe("half-typed code", () => {
	it("ends an unterminated string at the line break", () => {
		const tokens = run("const s = \"oops\nconst t = 1;");

		expect(ofType(tokens, "string")).toEqual(["\"oops"]);
		expect(ofType(tokens, "keyword")).toEqual(["const", "const"]);
	});

	it("runs an unterminated block comment to the end of the source", () => {
		const tokens = run("x(); /* oops\nconst y = 1;");

		expect(ofType(tokens, "comment")).toEqual(["/* oops\nconst y = 1;"]);
	});
});

describe("languages", () => {
	it("comments out the rest of the line in python", () => {
		const tokens = run("x = 1 # def not a keyword", "python");

		expect(ofType(tokens, "comment")).toEqual(["# def not a keyword"]);
		expect(ofType(tokens, "keyword")).toEqual([]);
	});

	it("takes a python triple quote whole", () => {
		// A greedy single-quote rule would read this as an empty string first.
		expect(ofType(run("s = \"\"\"a\nb\"\"\"", "python"), "string")).toEqual(["\"\"\"a\nb\"\"\""]);
	});

	it("highlights java block comments and strings", () => {
		const tokens = run("/* note */ String s = \"public\";", "java");

		expect(ofType(tokens, "comment")).toEqual(["/* note */"]);
		expect(ofType(tokens, "string")).toEqual(["\"public\""]);
		expect(ofType(tokens, "keyword")).toEqual([]);
	});

	it("highlights json literals without treating # as a comment", () => {
		const tokens = run("{ \"a\": true, \"b\": 1, \"c\": \"# not a comment\" }", "json");

		expect(ofType(tokens, "keyword")).toEqual(["true"]);
		expect(ofType(tokens, "number")).toEqual(["1"]);
		expect(ofType(tokens, "comment")).toEqual([]);
	});

	it("highlights typescript type keywords", () => {
		expect(ofType(run("interface A { b: string }", "typescript"), "keyword")).toEqual([
			"interface",
			"string"
		]);
	});

	it("builds usable rules for every supported language", () => {
		expect(supportedLanguages.length).toBeGreaterThan(0);

		for(const language of supportedLanguages) {
			const rules = rulesFor(language);

			expect(rules.length).toBeGreaterThan(0);

			for(const { pattern, type } of rules) {
				expect(pattern).toBeInstanceOf(RegExp);
				expect(["comment", "keyword", "number", "string"]).toContain(type);
			}
		}
	});
});

describe("the source is never altered", () => {
	it("preserves a realistic snippet when tokens are rejoined", () => {
		const source = [
			"/* Adds two numbers */",
			"function add(a, b) {",
			"\treturn a + b; // sum \"quoted\"",
			"}",
			"const msg = `total: ${add(1, 2)}`;"
		].join("\n");

		expect(join(run(source))).toBe(source);
	});

	it.each(supportedLanguages)("preserves arbitrary %s source", (language) => {
		// The invariant that matters most: highlighting must never lose,
		// duplicate or reorder a character, whatever it is handed.
		const alphabet = [..."abc {}();=+.#\n\t01", "\"", "'", "`", "/", "*", "\\"];
		const rules = rulesFor(language);

		let seed = 7;
		const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

		for(let attempt = 0; attempt < 200; attempt++) {
			let source = "";

			for(let index = 0; index < 60; index++) {
				source += alphabet[Math.floor(random() * alphabet.length)];
			}

			expect(join(tokenize(source, rules))).toBe(source);
		}
	});
});
