import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import {
  LEGAL_PRIVACY_LABEL,
  LEGAL_SUPPORT_LABEL,
  LEGAL_TERMS_LABEL,
} from "@/features/account/constants";
import { PRIVACY_URL, SUPPORT_URL, TERMS_URL } from "@/lib/legal-links";
import { openExternalLink } from "@/lib/open-external-link";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, PRESSED, SPACE } from "@/theme/tokens";

const LINKS = [
  { label: LEGAL_PRIVACY_LABEL, url: PRIVACY_URL },
  { label: LEGAL_TERMS_LABEL, url: TERMS_URL },
  { label: LEGAL_SUPPORT_LABEL, url: SUPPORT_URL },
] as const;

// App Store 5.1.1: reachable signed in or out, so a signed-out reviewer finds them too.
export const LegalLinks = () => {
  return (
    <Card background={null} onPress={null}>
      <View style={styles.rows}>
        {LINKS.map((link, index) => (
          <Pressable
            key={link.url}
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.divided,
              pressed && styles.pressed,
            ]}
            onPress={() => openExternalLink(link.url)}
          >
            <Text style={styles.label}>{link.label}</Text>
            <MaterialIcons name="open-in-new" size={CONTROL_ICON_SIZE} color={COLORS.inkMuted} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  rows: {
    marginVertical: -SPACE.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  label: {
    ...TEXT.body,
    color: COLORS.ink,
  },
  pressed: PRESSED,
});
