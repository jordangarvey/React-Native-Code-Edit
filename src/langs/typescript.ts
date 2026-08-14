import { keywords as javascriptKeywords } from "./javascript";
import type { LanguageDefinition } from "./types";

const typeKeywords = [
	"abstract",
	"any",
	"as",
	"asserts",
	"bigint",
	"boolean",
	"declare",
	"implements",
	"infer",
	"interface",
	"is",
	"keyof",
	"namespace",
	"never",
	"number",
	"object",
	"override",
	"private",
	"protected",
	"public",
	"readonly",
	"satisfies",
	"string",
	"symbol",
	"type",
	"unique",
	"unknown"
];

export const typescript: LanguageDefinition = {
	keywords: [...javascriptKeywords, ...typeKeywords],
	lineComments: ["//"],
	blockComments: [["/*", "*/"]],
	quotes: ["\"", "'"],
	blockQuotes: [["`", "`"]],
	numbers: true
};
