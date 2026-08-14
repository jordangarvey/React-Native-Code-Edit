import type { HighlightRule } from "../highlight";

import { java } from "./java";
import { javascript } from "./javascript";
import { json } from "./json";
import { python } from "./python";
import { typescript } from "./typescript";
import type { Delimiters, LanguageDefinition } from "./types";

const languages = {
	java,
	javascript,
	json,
	python,
	typescript
} satisfies Record<string, LanguageDefinition>;

/** Names accepted by the editor's `language` prop. */
export type Language = keyof typeof languages;

export const supportedLanguages = Object.keys(languages).sort() as Language[];

export type { Delimiters, LanguageDefinition };

function escapeRegExp(source: string): string {
	return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeCharClass(source: string): string {
	return source.replace(/[\]\\^-]/g, "\\$&");
}

/**
 * Comments run to the closing delimiter, or to the end of the source when it is
 * missing — a half-typed block should still read as a comment.
 */
function blockCommentRule([open, close]: Delimiters): HighlightRule {
	const pattern = `${escapeRegExp(open)}[\\s\\S]*?(?:${escapeRegExp(close)}|$)`;

	return { type: "comment", pattern: new RegExp(pattern, "g") };
}

/** As above, but a backslash escapes the next character, so `` \` `` cannot close. */
function blockQuoteRule([open, close]: Delimiters): HighlightRule {
	const pattern = `${escapeRegExp(open)}(?:\\\\[\\s\\S]|[^\\\\])*?(?:${escapeRegExp(close)}|$)`;

	return { type: "string", pattern: new RegExp(pattern, "g") };
}

/** Single-line strings give up at the line break rather than running away. */
function quoteRule(quote: string): HighlightRule {
	const body = `(?:\\\\.|[^${escapeCharClass(quote)}\\\\\\n])*`;
	const pattern = `${escapeRegExp(quote)}${body}(?:${escapeRegExp(quote)})?`;

	return { type: "string", pattern: new RegExp(pattern, "g") };
}

function keywordRule(keywords: readonly string[]): HighlightRule {
	// Longest first so `instanceof` is preferred over `in` at the same position.
	const alternation = [...keywords]
		.sort((a, b) => b.length - a.length)
		.map(escapeRegExp)
		.join("|");

	// The word boundaries stop `for` matching inside `formatted`.
	return { type: "keyword", pattern: new RegExp(`\\b(?:${alternation})\\b`, "g") };
}

const numberRule: HighlightRule = {
	type: "number",
	pattern: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g
};

/**
 * Builds the rules for a language, most specific first.
 *
 * Order only settles ties — `tokenize` prefers whichever rule matches earliest —
 * but ties are real: `"""` has to beat `"`, and a keyword must never win against
 * a string or comment that opens at the same character.
 */
export function rulesFor(language: Language): HighlightRule[] {
	const definition = languages[language];
	const rules: HighlightRule[] = [];

	for(const delimiters of definition.blockComments ?? []) {
		rules.push(blockCommentRule(delimiters));
	}

	if(definition.lineComments && definition.lineComments.length > 0) {
		const openers = definition.lineComments.map(escapeRegExp).join("|");

		// `.` stops at the newline, so the comment ends with its line.
		rules.push({ type: "comment", pattern: new RegExp(`(?:${openers}).*`, "g") });
	}

	for(const delimiters of definition.blockQuotes ?? []) {
		rules.push(blockQuoteRule(delimiters));
	}

	for(const quote of definition.quotes ?? []) {
		rules.push(quoteRule(quote));
	}

	if(definition.numbers) {
		rules.push(numberRule);
	}

	if(definition.keywords && definition.keywords.length > 0) {
		rules.push(keywordRule(definition.keywords));
	}

	return rules;
}
