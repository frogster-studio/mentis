import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { CategoryPill } from "@/components/category-pill";
import { Marquee } from "@/components/ui/marquee";
import { NewButton } from "@/components/ui/new-button";
import { StreakBadge } from "@/features/account/components/streak-badge";
import {
  PRACTICE_CTA_LABEL,
  PRACTICE_PILL_ICONS,
  PRACTICE_PITCH,
  PRACTICE_TITLE,
} from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, RADIUS, SPACE } from "@/theme/tokens";
import { gradient } from "@/utils/gradient";

export const PracticeCard = () => {
  const router = useRouter();

  return (
    <FastSquircleView style={styles.card}>
      <Text style={styles.title}>{PRACTICE_TITLE} </Text>
      <Text style={styles.pitch}>
        {PRACTICE_PITCH.map((run) => (
          <Text key={run.text} style={run.strong ? styles.pitchStrong : null}>
            {run.text}
          </Text>
        ))}
      </Text>

      <StreakBadge streak={45} />

      <View>
        <GradientOverlay direction="right" />

        <Marquee gap={SPACE.sm}>
          {PRACTICE_PILL_ICONS.map((icon) => (
            <CategoryPill
              key={icon}
              icon={icon}
              color={"#E09250"}
              iconBg={"#FFB15E"}
              label={null}
            />
          ))}
        </Marquee>

        <GradientOverlay direction="left" />
      </View>

      <View style={styles.action}>
        <NewButton
          layout="block"
          shape="full"
          tone="default"
          icon="play-circle-outline"
          label={PRACTICE_CTA_LABEL}
          accessibilityLabel={null}
          onPress={() => router.push("/picker")}
          disabled={false}
          pending={false}
        />
      </View>
    </FastSquircleView>
  );
};

const GradientOverlay = ({ direction }: { direction: "left" | "right" }) => {
  return (
    <View
      style={[
        styles.gradientOverlay,
        {
          [direction]: 0,
          ...gradient(`linear-gradient(to ${direction}, ${COLORS.primary}00, ${COLORS.primary})`),
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    margin: GUTTER,
    padding: SPACE.lg,
    ...gradient(
      `radial-gradient(farthest-corner at 50% 150%, ${COLORS.yellow}, ${COLORS.primary})`,
    ),
    borderRadius: RADIUS.base,
  },
  title: { ...TEXT.sectionTitle, color: COLORS.ink, paddingRight: SPACE.lg },
  pitch: {
    ...TEXT.caption,
    color: COLORS.ink,
    opacity: 0.8,
    marginTop: SPACE.sm,
    marginBottom: SPACE.md,
  },
  pitchStrong: TEXT.captionStrong,
  action: {
    marginTop: SPACE.md,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 1,
    width: "10%",
  },
});
