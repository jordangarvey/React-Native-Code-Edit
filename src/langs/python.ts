import type { LanguageDefinition } from "./types";

export const keywords = [
	"False",
	"None",
	"True",
	"and",
	"as",
	"assert",
	"async",
	"await",
	"break",
	"case",
	"class",
	"continue",
	"def",
	"del",
	"elif",
	"else",
	"except",
	"finally",
	"for",
	"from",
	"global",
	"if",
	"import",
	"in",
	"is",
	"lambda",
	"match",
	"nonlocal",
	"not",
	"or",
	"pass",
	"raise",
	"return",
	"try",
	"while",
	"with",
	"yield"
];

export const python: LanguageDefinition = {
	keywords,
	lineComments: ["#"],
	// Listed before the single-character quotes so a triple quote is taken
	// whole rather than read as an empty string followed by another.
	blockQuotes: [["\"\"\"", "\"\"\""], ["'''", "'''"]],
	quotes: ["\"", "'"],
	numbers: true
};
