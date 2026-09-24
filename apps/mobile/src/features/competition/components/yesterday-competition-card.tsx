import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { NewButton } from "@/components/ui/new-button";
import { catchupTimeLeft, msUntilParisMidnight } from "@/features/competition/catchup-deadline";
import {
  CATCHUP_HOURS_UNIT,
  CATCHUP_MINUTES_UNIT,
  CATCHUP_TEASER_END,
  CATCHUP_TEASER_START,
  CATCHUP_TITLE,
  COMPETITION_CATCHUP_LABEL,
} from "@/features/competition/constants";
import { PremiumCrownStamp } from "@/features/premium/components/premium-crown-stamp";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const PLAY_AGAIN_IMAGE = require("../../../../assets/images/competition/play-again-landscape.png");
const REFRESH_MS = 60000;

export interface YesterdayCompetitionCardProps {
  onPress: () => void;
  onExpire: () => void;
}

export const YesterdayCompetitionCard = ({ onPress, onExpire }: YesterdayCompetitionCardProps) => {
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      const current = new Date();
      setNow(current);
      const tick = setInterval(() => setNow(new Date()), REFRESH_MS);
      const expiry = setTimeout(onExpire, msUntilParisMidnight(current));
      return () => {
        clearInterval(tick);
        clearTimeout(expiry);
      };
    }, [onExpire]),
  );
  const { hours, minutes } = catchupTimeLeft(now);
  const timeLeft =
    hours > 0
      ? `${hours}${CATCHUP_HOURS_UNIT}${String(minutes).padStart(2, "0")}`
      : `${minutes}${CATCHUP_MINUTES_UNIT}`;

  return (
    <FastSquircleView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{CATCHUP_TITLE}</Text>
          <Text style={styles.subtitle}>
            {CATCHUP_TEASER_START} <Text style={styles.time}>{timeLeft}</Text> {CATCHUP_TEASER_END}
          </Text>
        </View>

        <View style={styles.imageContainer}>
          <Image source={PLAY_AGAIN_IMAGE} contentFit="contain" style={styles.image} />
        </View>
      </View>

      <View>
        <NewButton
          layout="block"
          shape="full"
          tone="default"
          label={COMPETITION_CATCHUP_LABEL}
          icon="play-circle-outline"
          accessibilityLabel={null}
          disabled={false}
          pending={false}
          onPress={onPress}
        />
        <View style={styles.premiumContainer}>
          <PremiumCrownStamp />
        </View>
      </View>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.catchupWash, borderRadius: RADIUS.base, padding: SPACE.lg },
  content: { flexDirection: "row" },
  title: { ...TEXT.sectionTitle, color: COLORS.ink },
  textContainer: { flex: 10, paddingBottom: SPACE.lg },
  subtitle: { ...TEXT.caption, opacity: 0.8, color: COLORS.ink },
  time: { ...TEXT.captionStrong, color: COLORS.ink },
  imageContainer: { flex: 9 },
  premiumContainer: { position: "absolute", top: -SPACE.xl, right: -SPACE.sm },
  image: {
    position: "absolute",
    bottom: -SPACE.xxs,
    left: 0,
    aspectRatio: 471 / 439,
    width: "100%",
  },
});
