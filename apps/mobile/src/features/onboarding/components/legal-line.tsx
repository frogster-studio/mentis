import { StyleSheet, Text } from "react-native";
import {
  LEGAL_CONJUNCTION,
  LEGAL_INTRO,
  LEGAL_PRIVACY_LABEL,
  LEGAL_TERMS_LABEL,
} from "@/features/onboarding/constants";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal-links";
import { openExternalLink } from "@/lib/open-external-link";
import { TEXT } from "@/theme/text";
import { COLORS } from "@/theme/tokens";

export const LegalLine = () => {
  return (
    <Text style={styles.sentence}>
      {LEGAL_INTRO}
      {/* The sheet opening is the feedback, so the tap draws no highlight of its own. */}
      <Text style={styles.link} suppressHighlighting onPress={() => openExternalLink(PRIVACY_URL)}>
        {LEGAL_PRIVACY_LABEL}
      </Text>
      {LEGAL_CONJUNCTION}
      <Text style={styles.link} suppressHighlighting onPress={() => openExternalLink(TERMS_URL)}>
        {LEGAL_TERMS_LABEL}
      </Text>
    </Text>
  );
};

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
