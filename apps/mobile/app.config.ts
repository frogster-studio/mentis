import type { ExpoConfig } from "expo/config";

// Explicit rather than read off NODE_ENV
const IS_PRODUCTION = process.env.APP_VARIANT === "production";

const APP_NAME = IS_PRODUCTION ? "Mentis" : "Mentis dev";
const APP_SCHEME = IS_PRODUCTION ? "mentis" : "mentis-dev";
const BUNDLE_IDENTIFIER = IS_PRODUCTION
  ? "com.frogsterstudio.mentis"
  : "com.frogsterstudio.mentis.dev";

// Google's iOS URL scheme is the client id's leading segment reversed onto the Google domain.
const IOS_URL_SCHEME = `com.googleusercontent.apps.${
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.split(".")[0] ?? ""
}`;

const config: ExpoConfig = {
  name: APP_NAME,
  slug: "mentis",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: APP_SCHEME,
  userInterfaceStyle: "light",
  ios: { icon: "./assets/expo.icon", bundleIdentifier: BUNDLE_IDENTIFIER, usesAppleSignIn: true },
  android: {
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: BUNDLE_IDENTIFIER,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-image",
    "expo-web-browser",
    [
      "expo-font",
      {
        fonts: [
          "./assets/fonts/Lexend-Bold.ttf",
          "./assets/fonts/Poppins-Regular.ttf",
          "./assets/fonts/Poppins-SemiBold.ttf",
        ],
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F6F6F6",
        image: "./assets/images/splash-icon.png",
        imageWidth: 96,
      },
    ],
    ["@react-native-google-signin/google-signin", { iosUrlScheme: IOS_URL_SCHEME }],
    [
      "expo-build-properties",
      {
        ios: {
          extraPods: [
            { name: "GoogleUtilities", modular_headers: true },
            { name: "RecaptchaInterop", modular_headers: true },
          ],
        },
      },
    ],
    "./plugins/with-ios-development-team",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
