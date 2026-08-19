import * as WebBrowser from "expo-web-browser";
import { Linking, Platform, StyleSheet, Text } from "react-native";
import {
  LEGAL_CONJUNCTION,
  LEGAL_INTRO,
  LEGAL_PRIVACY_LABEL,
  LEGAL_TERMS_LABEL,
  LEGAL_URL,
} from "@/features/onboarding/constants";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

// Web has no in-app sheet, and expo-web-browser opens a cramped popup window there instead of a tab.
function openLegal() {
  if (Platform.OS === "web") {
    void Linking.openURL(LEGAL_URL);
    return;
  }
  void WebBrowser.openBrowserAsync(LEGAL_URL);
}

export function LegalLine() {
  return (
    <Text style={styles.sentence}>
      {LEGAL_INTRO}
      {/* The sheet opening is the feedback, so the tap draws no highlight of its own. */}
      <Text style={styles.link} suppressHighlighting onPress={openLegal}>
        {LEGAL_PRIVACY_LABEL}
      </Text>
      {LEGAL_CONJUNCTION}
      <Text style={styles.link} suppressHighlighting onPress={openLegal}>
        {LEGAL_TERMS_LABEL}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  sentence: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  link: {
    ...TEXT.captionStrong,
    color: COLORS.ink,
  },
});
