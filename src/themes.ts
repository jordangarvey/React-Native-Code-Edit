export interface CodeEditorTheme {
	background: string;
	/** Caret and selection colour. The input's own text is invisible. */
	caret: string;
	/** Anything no rule claimed. */
	plain: string;
	comment: string;
	keyword: string;
	number: string;
	string: string;
}

export const themes = {
	light: {
		background: "#FFFFFF",
		caret: "#4A62A8",
		plain: "#24292F",
		comment: "#6A737D",
		keyword: "#4A62A8",
		number: "#A85A16",
		string: "#1F7A4D"
	},
	dark: {
		background: "#16181D",
		caret: "#7796CB",
		plain: "#E4E7EF",
		comment: "#7A8395",
		// The blue this package has highlighted keywords with since 0.1.0. It
		// never had the contrast for a white background, but it belongs here.
		keyword: "#7796CB",
		number: "#D8AC63",
		string: "#7CC3A0"
	}
} satisfies Record<string, CodeEditorTheme>;

export type ThemeName = keyof typeof themes;
