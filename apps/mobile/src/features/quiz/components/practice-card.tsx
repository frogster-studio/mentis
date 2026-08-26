import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { CategoryPill } from "@/components/category-pill";
import { Marquee } from "@/components/ui/marquee";
import { NewButton } from "@/components/ui/new-button";
import { Squircle } from "@/components/ui/squircle";
import {
  PRACTICE_CTA_LABEL,
  PRACTICE_PILL_ICONS,
  PRACTICE_PITCH,
  PRACTICE_TITLE,
} from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

const PILL_GAP = SPACE.sm;

export function PracticeCard() {
  const router = useRouter();

  return (
    <Squircle radius={RADIUS.base} color={COLORS.primary} style={styles.card}>
      <Text style={styles.title}>{PRACTICE_TITLE}</Text>
      <Text style={styles.pitch}>
        {PRACTICE_PITCH.map((run) => (
          <Text key={run.text} style={run.strong ? styles.pitchStrong : null}>
            {run.text}
          </Text>
        ))}
      </Text>
      {/* Full bleed: the row runs under the card's edges and the fades take it from there. */}
      <Marquee gap={PILL_GAP} fadeColor={COLORS.primary}>
        {PRACTICE_PILL_ICONS.map((icon) => (
          <CategoryPill key={icon} icon={icon} />
        ))}
      </Marquee>
      <View style={styles.action}>
        <NewButton
          shape="full"
          label={PRACTICE_CTA_LABEL}
          icon="play-circle-outline"
          onPress={() => router.push("/picker")}
        />
      </View>
    </Squircle>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: GUTTER,
    paddingVertical: SPACE.lg,
  },
  title: {
    ...TEXT.sectionTitle,
    color: COLORS.ink,
    paddingHorizontal: SPACE.lg,
  },
  pitch: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    marginTop: SPACE.sm,
    marginBottom: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  pitchStrong: TEXT.captionStrong,
  action: {
    marginTop: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
});
