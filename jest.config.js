const base = {
	preset: "@react-native/jest-preset",
	testMatch: ["<rootDir>/test/**/*.test.{ts,tsx}"]
};

// The component renders the same tree everywhere except for its default font,
// but "it built on iOS" is not something to take on trust — so the whole suite
// runs once per platform.
module.exports = {
	collectCoverageFrom: ["src/**/*.{ts,tsx}"],
	projects: [
		{
			...base,
			displayName: "ios",
			haste: { defaultPlatform: "ios", platforms: ["ios", "native"] }
		},
		{
			...base,
			displayName: "android",
			haste: { defaultPlatform: "android", platforms: ["android", "native"] }
		}
	]
};
