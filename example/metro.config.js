const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// The library is one directory up rather than in node_modules, so Metro has to
// be told to watch it, and to resolve react and react-native to a single copy —
// two copies of React in one tree is a runtime error, not a warning.
config.watchFolders = [packageRoot];

config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(packageRoot, "node_modules")
];

config.resolver.extraNodeModules = {
	react: path.resolve(projectRoot, "node_modules/react"),
	"react-native": path.resolve(projectRoot, "node_modules/react-native")
};

module.exports = config;
