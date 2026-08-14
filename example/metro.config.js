const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// The library is one directory up rather than in node_modules, so Metro has to
// be told to watch it.
config.watchFolders = [packageRoot];

config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules")
];

// `file:..` installs the library as a symlink, so everything it imports resolves
// from the repository root — which keeps its own react and react-native as
// devDependencies, at different versions to the app's. Two copies of React in
// one tree is a runtime error ("invalid hook call"), not a warning.
//
// extraNodeModules cannot fix this: it is consulted only when normal resolution
// fails, and here it succeeds against the wrong copy. So these are resolved as
// though the app itself had asked for them, whoever actually did.
const singletons = ["react", "react-native"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
	const isSingleton = singletons.some(
		(name) => moduleName === name || moduleName.startsWith(`${name}/`)
	);

	const origin = isSingleton
		? { ...context, originModulePath: path.join(projectRoot, "index.js") }
		: context;

	return context.resolveRequest(origin, moduleName, platform);
};

module.exports = config;
