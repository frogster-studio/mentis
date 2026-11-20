const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// PROTOTYPE: stub the squircle native view on web (ticket 89's workaround).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-fast-squircle") {
    return { type: "sourceFile", filePath: path.join(__dirname, "prototype/fast-squircle-web-stub.js") };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
