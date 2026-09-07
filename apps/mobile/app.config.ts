import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import type { ExpoConfig } from "expo/config";
import { AndroidConfig, type ConfigPlugin, withAndroidStyles } from "expo/config-plugins";

const VARIANT = process.env.APP_VARIANT ?? "development";
const IS_PRODUCTION = VARIANT === "production";

const APP_NAME = IS_PRODUCTION ? "Mentis" : "Mentis dev";
const APP_SCHEME = IS_PRODUCTION ? "mentis" : "mentis-dev";
const BUNDLE_IDENTIFIER = IS_PRODUCTION
  ? "com.frogsterstudio.mentis"
  : "com.frogsterstudio.mentis.dev";

const envFile = `${__dirname}/.env.${VARIANT}`;
// EAS Build never receives the gitignored env files — there the values come off the build profile.
const env = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : process.env;

const read = (key: string): string => {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing ${key} in .env.${VARIANT}`);
  }
  return value;
};

const GOOGLE_IOS_CLIENT_ID = read("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID");
// Google's iOS URL scheme is the client id's leading segment reversed onto the Google domain.
const IOS_URL_SCHEME = `com.googleusercontent.apps.${GOOGLE_IOS_CLIENT_ID.split(".")[0]}`;

// Android would otherwise scrim the three-button navigation bar and draw both bars' icons white.
const SYSTEM_BAR_STYLE_ITEMS = {
  "android:enforceNavigationBarContrast": "false",
  "android:windowLightNavigationBar": "true",
  "android:windowLightStatusBar": "true",
};

const withSystemBarsOnPaper: ConfigPlugin = (expoConfig) =>
  withAndroidStyles(expoConfig, (styles) => {
    const parent = AndroidConfig.Styles.getAppThemeGroup();
    for (const [name, value] of Object.entries(SYSTEM_BAR_STYLE_ITEMS)) {
      styles.modResults = AndroidConfig.Styles.assignStylesValue(styles.modResults, {
        add: true,
        name,
        value,
        parent,
      });
    }
    return styles;
  });

const config: ExpoConfig = {
  name: APP_NAME,
  slug: "mentis",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: APP_SCHEME,
  userInterfaceStyle: "light",
  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: BUNDLE_IDENTIFIER,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
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
          "./assets/fonts/EpundaSlab-Regular.ttf",
          "./assets/fonts/InterTight-Regular.ttf",
          "./assets/fonts/InterTight-SemiBold.ttf",
        ],
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F5EBE2",
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "f7cff9c2-f627-4c76-a439-6276413508db",
    },
    apiUrl: read("EXPO_PUBLIC_API_URL"),
    supabaseUrl: read("EXPO_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey: read("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    googleWebClientId: read("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"),
    googleIosClientId: GOOGLE_IOS_CLIENT_ID,
    revenueCatIosApiKey: read("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY"),
    revenueCatAndroidApiKey: read("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY"),
  },
};

export default withSystemBarsOnPaper(config);
