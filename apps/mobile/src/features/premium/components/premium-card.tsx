import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { NewButton } from "@/components/ui/new-button";
import {
  PREMIUM_ACTIVE_MESSAGE,
  PREMIUM_ACTIVE_TITLE,
  PREMIUM_CTA_LABEL,
  PREMIUM_PITCH,
  PREMIUM_TITLE,
} from "@/features/premium/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

const CROWN_SIZE = 20;

export interface PremiumCardProps {
  isPremium: boolean;
  onOpenPaywall: () => void;
}

export const PremiumCard = ({ isPremium, onOpenPaywall }: PremiumCardProps) => {
  return (
    <Card onPress={null}>
      <View style={styles.heading}>
        <MaterialCommunityIcons name="crown-outline" size={CROWN_SIZE} color={COLORS.ink} />
        <Text style={styles.title}>{isPremium ? PREMIUM_ACTIVE_TITLE : PREMIUM_TITLE}</Text>
      </View>
      <Text style={styles.pitch}>{isPremium ? PREMIUM_ACTIVE_MESSAGE : PREMIUM_PITCH}</Text>
      {isPremium ? null : (
        <View style={styles.cta}>
          <NewButton
            layout="block"
            shape="rounded"
            tone="primary"
            label={PREMIUM_CTA_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={false}
            pending={false}
            onPress={onOpenPaywall}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
  },
  title: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
  },
  pitch: {
    ...TEXT.body,
    marginTop: SPACE.xs,
    color: COLORS.inkMuted,
  },
  cta: {
    marginTop: SPACE.md,
  },
});
