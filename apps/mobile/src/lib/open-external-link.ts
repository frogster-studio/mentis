import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";

// Web has no in-app sheet, and expo-web-browser opens a cramped popup window there instead of a tab.
export function openExternalLink(url: string) {
  if (Platform.OS === "web") {
    void Linking.openURL(url);
    return;
  }
  void WebBrowser.openBrowserAsync(url);
}
