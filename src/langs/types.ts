/** An opening and closing delimiter pair, such as `["/*", "*​/"]`. */
export type Delimiters = readonly [open: string, close: string];

export interface LanguageDefinition {
	/** Reserved words highlighted when they appear as whole words. */
	keywords?: readonly string[];
	/** Openers that comment out the rest of the line, such as `//` or `#`. */
	lineComments?: readonly string[];
	/** Delimiter pairs for comments that may span lines. */
	blockComments?: readonly Delimiters[];
	/** Quote characters for strings that end at the line break. */
	quotes?: readonly string[];
	/** Delimiter pairs for strings that may span lines, such as backticks. */
	blockQuotes?: readonly Delimiters[];
	/** Whether numeric literals should be highlighted. */
	numbers?: boolean;
}
