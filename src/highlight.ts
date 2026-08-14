import type { StyleProp, TextStyle } from "react-native";

/** A regular expression paired with the style applied to whatever it matches. */
export interface HighlightPattern {
	pattern: RegExp;
	style: StyleProp<TextStyle>;
}

/** A run of characters that shares a single style. */
export interface Token {
	text: string;
	/** Left undefined for text no pattern claimed. */
	style?: StyleProp<TextStyle>;
}

/**
 * Splits source into styled runs.
 *
 * Patterns are applied in order and the first one to claim a region wins, so
 * callers should list patterns from most to least specific — comments before
 * keywords, otherwise `return` inside `// early return` would be styled twice.
 */
export function tokenize(code: string, patterns: HighlightPattern[]): Token[] {
	let tokens: Token[] = [{ text: code }];

	for(const { pattern, style } of patterns) {
		// exec() only advances lastIndex on global patterns; without the flag the
		// loop below would rescan the same match forever.
		const scanner = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
		const next: Token[] = [];

		for(const token of tokens) {
			if(token.style !== undefined) {
				next.push(token);
				continue;
			}

			// Global patterns carry lastIndex between calls, so reset per token.
			scanner.lastIndex = 0;

			let cursor = 0;
			let match: RegExpExecArray | null;

			while((match = scanner.exec(token.text)) !== null) {
				if(match.index > cursor) {
					next.push({ text: token.text.slice(cursor, match.index) });
				}

				next.push({ text: match[0], style });
				cursor = match.index + match[0].length;

				// An empty match leaves lastIndex where it is; nudge it along.
				if(match[0].length === 0) {
					scanner.lastIndex++;
				}
			}

			if(cursor < token.text.length) {
				next.push({ text: token.text.slice(cursor) });
			}
		}

		tokens = next;
	}

	return tokens.filter((token) => token.text.length > 0);
}
