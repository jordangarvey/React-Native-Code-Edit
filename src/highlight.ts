/** What a run of characters means, independent of how it is coloured. */
export type TokenType = "plain" | "keyword" | "comment" | "string" | "number";

/** A rule that claims a run of source and labels it. */
export interface HighlightRule {
	type: Exclude<TokenType, "plain">;
	pattern: RegExp;
}

export interface Token {
	text: string;
	type: TokenType;
}

/**
 * Splits source into labelled runs.
 *
 * The scan runs left to right and the rule that matches earliest wins, which is
 * what keeps constructs from leaking into each other: in `const u = "http://x"`
 * the string starts before the `//`, so the comment rule never gets a look in,
 * and in `// see "notes"` the comment starts first. Rules that match at the
 * same position are settled by their order in the list.
 */
export function tokenize(code: string, rules: HighlightRule[]): Token[] {
	if(code.length === 0 || rules.length === 0) {
		return code.length === 0 ? [] : [{ text: code, type: "plain" }];
	}

	// exec() only advances past a match on global patterns.
	const scanners = rules.map(({ pattern }) => (
		pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`)
	));

	// Each rule's next match is cached so a rule scans the source once overall
	// rather than once per token produced.
	const pending: (RegExpExecArray | null)[] = rules.map(() => null);
	const spent: boolean[] = rules.map(() => false);

	const tokens: Token[] = [];
	let cursor = 0;
	let plainFrom = 0;

	while(cursor < code.length) {
		let winner = -1;

		for(let index = 0; index < rules.length; index++) {
			if(spent[index]) {
				continue;
			}

			let match = pending[index];

			// Re-scan when the cached match has been swallowed by a rule that
			// won an earlier round.
			if(match === null || match.index < cursor) {
				const scanner = scanners[index]!;

				scanner.lastIndex = cursor;
				match = scanner.exec(code);

				// A rule that can match nothing would never advance the cursor.
				if(match === null || match[0].length === 0) {
					spent[index] = true;
					pending[index] = null;
					continue;
				}

				pending[index] = match;
			}

			if(winner === -1 || match.index < pending[winner]!.index) {
				winner = index;
			}
		}

		if(winner === -1) {
			break;
		}

		const match = pending[winner]!;

		if(match.index > plainFrom) {
			tokens.push({ text: code.slice(plainFrom, match.index), type: "plain" });
		}

		tokens.push({ text: match[0], type: rules[winner]!.type });

		cursor = match.index + match[0].length;
		plainFrom = cursor;
	}

	if(plainFrom < code.length) {
		tokens.push({ text: code.slice(plainFrom), type: "plain" });
	}

	return tokens;
}
