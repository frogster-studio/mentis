import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { AppHistorySession } from "@mentis/contracts/app";
import { SessionTypeEnum } from "@mentis/contracts/enums";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import { HISTORY_QUESTIONS_UNIT } from "@/features/account/constants";
import { durationFigure, scoreFigure } from "@/features/account/stat-figures";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";
import { MEDAL_IMAGE } from "@/utils/assets";

export interface HistoryRowProps {
  session: AppHistorySession;
}

export const HistoryRow = ({ session }: HistoryRowProps) => {
  const [score, scale] = scoreFigure(session.score);

  return (
    <FastSquircleView style={styles.container}>
      <View style={styles.header}>
        {session.category && (
          <FastSquircleView
            style={{
              backgroundColor: session.category.color,
              padding: SPACE.xxs,
              borderRadius: SPACE.xs,
            }}
          >
            <MaterialIcons
              name={iconNameOrFallback(session.category.icon)}
              size={16}
              color={COLORS.ink}
            />
          </FastSquircleView>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.themeName} numberOfLines={1}>
            {session.themeName}
          </Text>

          <View style={styles.details}>
            <Text
              style={styles.detail}
            >{`${session.questionCount} ${HISTORY_QUESTIONS_UNIT}`}</Text>
            {session.durationMs === null ? null : (
              <Text style={styles.detail}>{`·  ${durationFigure(session.durationMs)}`}</Text>
            )}
          </View>
        </View>

        <View style={styles.score}>
          <View style={styles.scoreValueContainer}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreScale}>{scale}</Text>
          </View>
        </View>
      </View>

      {session.type === SessionTypeEnum.COMPETITION && (
        <Image source={MEDAL_IMAGE} contentFit="contain" style={styles.medal} />
      )}
    </FastSquircleView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    padding: SPACE.md,
    borderRadius: SPACE.md,
    gap: SPACE.sm,
  },
  header: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  themeName: { flex: 1, ...TEXT.statTextLine, color: COLORS.ink },
  score: { flexDirection: "row", alignItems: "center", marginRight: SPACE.lg },
  scoreValueContainer: { flexDirection: "row", alignItems: "baseline", gap: SPACE.xxs },
  scoreValue: { ...TEXT.statRowValue, color: COLORS.ink },
  scoreScale: { ...TEXT.premiumLabel, color: COLORS.inkMuted },
  details: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: SPACE.xs },
  detail: { ...TEXT.smallText, color: COLORS.inkMuted },
  medal: {
    width: SPACE.xl,
    aspectRatio: 237 / 393,
    position: "absolute",
    right: SPACE.xxs,
    top: -SPACE.xs,
  },
});
