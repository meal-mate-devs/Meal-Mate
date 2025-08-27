const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

// Suppress console warnings for known issues
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress specific Expo Router warnings that are expected
    if (message.includes('[Layout children]: No route named') ||
        message.includes('StatusBar backgroundColor is not supported with edge-to-edge enabled')) {
      return;
    }
  }
  originalWarn.apply(console, args);
};

module.exports = withNativeWind(config, { input: "./globals.css" });
