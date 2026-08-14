import type { TextStyle } from "react-native";

import type { HighlightPattern } from "../highlight";

import * as java from "./java";
import * as javascript from "./javascript";

export interface LanguageDefinition {
	keywords: readonly string[];
	singleLineComments: readonly string[];
}

const languages = { java, javascript } satisfies Record<string, LanguageDefinition>;

/** Names accepted by the editor's `language` prop. */
export type Language = keyof typeof languages;

export const supportedLanguages = Object.keys(languages) as Language[];

const keywordStyle: TextStyle = { color: "#7796CB" };
const commentStyle: TextStyle = { color: "grey" };

function escapeRegExp(source: string): string {
	return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds the ordered pattern list for a language.
 *
 * Comments come first so that keywords inside them stay comment-coloured —
 * `tokenize` gives the first matching pattern the run.
 */
export function patternsFor(language: Language): HighlightPattern[] {
	const { keywords, singleLineComments } = languages[language];
	const patterns: HighlightPattern[] = [];

	if(singleLineComments.length > 0) {
		const openers = singleLineComments.map(escapeRegExp).join("|");

		patterns.push({
			pattern: new RegExp(`(?:${openers}).*$`, "gm"),
			style: commentStyle
		});
	}

	if(keywords.length > 0) {
		const alternation = keywords.map(escapeRegExp).join("|");

		// The word boundaries matter: without them `for` matches inside
		// `formatted` and `in` matches twice inside `printer.info`.
		patterns.push({
			pattern: new RegExp(`\\b(?:${alternation})\\b`, "g"),
			style: keywordStyle
		});
	}

	return patterns;
}
