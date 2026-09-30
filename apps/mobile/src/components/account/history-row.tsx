import type { AppHistorySession } from "@mentis/contracts/app";
import { SessionTypeEnum } from "@mentis/contracts/enums";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { CategoryLabel } from "@/components/account/category-label";
import { HISTORY_QUESTIONS_UNIT } from "@/features/account/constants";
import { durationFigure, scoreFigure } from "@/features/account/stat-figures";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

const MEDAL_IMAGE = require("../../../assets/images/competition/medal.png");

export interface HistoryRowProps {
  session: AppHistorySession;
}

export const HistoryRow = ({ session }: HistoryRowProps) => {
  const [score, scale] = scoreFigure(session.score);

  return (
    <FastSquircleView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.themeName} numberOfLines={1}>
          {session.themeName}
        </Text>

        <View style={styles.score}>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreScale}>{scale}</Text>
          {session.type === SessionTypeEnum.COMPETITION ? (
            <Image source={MEDAL_IMAGE} contentFit="contain" style={styles.medal} />
          ) : null}
        </View>
      </View>

      <View style={styles.details}>
        {session.category ? <CategoryLabel category={session.category} /> : null}
        <Text style={styles.detail}>{`${session.questionCount} ${HISTORY_QUESTIONS_UNIT}`}</Text>
        {session.durationMs === null ? null : (
          <Text style={styles.detail}>{durationFigure(session.durationMs)}</Text>
        )}
      </View>
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    padding: SPACE.lg,
    borderRadius: SPACE.lg,
    gap: SPACE.sm,
  },
  header: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  themeName: { flex: 1, ...TEXT.statTextLine, color: COLORS.ink },
  score: { flexDirection: "row", alignItems: "center", gap: SPACE.xxs },
  scoreValue: { ...TEXT.statRowValue, color: COLORS.ink },
  scoreScale: { ...TEXT.premiumLabel, color: COLORS.inkMuted },
  medal: { width: SPACE.md, aspectRatio: 243 / 408 },
  details: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: SPACE.sm },
  detail: { ...TEXT.smallText, color: COLORS.inkMuted },
});
