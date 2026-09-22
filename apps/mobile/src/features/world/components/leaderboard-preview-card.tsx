import type { AppCompetitionLeaderboardPageResponse } from "@mentis/contracts/app";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { LEADERBOARD_EMPTY } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

const MEDAL_IMAGE = require("../../../../assets/images/competition/medal.png");

export interface LeaderboardPreviewCardProps {
  entries: AppCompetitionLeaderboardPageResponse["entries"];
  myPseudo: string | null;
  onPress: () => void;
}

export const LeaderboardPreviewCard = ({
  entries,
  myPseudo,
  onPress,
}: LeaderboardPreviewCardProps) => {
  return (
    <Pressable onPress={onPress}>
      <FastSquircleView style={styles.card}>
        <View style={styles.rows}>
          {entries.length === 0 ? (
            <Text style={styles.empty}>{LEADERBOARD_EMPTY}</Text>
          ) : (
            entries.map((entry, index) => (
              <FastSquircleView
                key={entry.pseudo}
                style={[
                  styles.row,
                  {
                    paddingLeft: index * 10,
                    backgroundColor:
                      entry.pseudo === myPseudo ? `${COLORS.background}25` : undefined,
                  },
                ]}
              >
                <Text style={styles.rank}>n° {entry.rank}</Text>
                <Text style={styles.pseudo} numberOfLines={1}>
                  {entry.pseudo}
                </Text>
                <Text style={styles.points}>
                  {entry.seasonTotal} {POINTS_UNIT}
                </Text>
              </FastSquircleView>
            ))
          )}
        </View>

        <Image
          source={MEDAL_IMAGE}
          contentFit="contain"
          style={styles.medal}
          pointerEvents="none"
          accessible={false}
        />
      </FastSquircleView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.base, backgroundColor: COLORS.bordeau },
  rows: { paddingLeft: SPACE.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.sm,
  },
  rank: { ...TEXT.captionStrong, color: COLORS.face },
  pseudo: { ...TEXT.body, color: COLORS.face, flex: 1 },
  points: { ...TEXT.captionStrong, color: COLORS.face },
  empty: { ...TEXT.body, color: COLORS.face, paddingVertical: SPACE.xs },
  medal: {
    position: "absolute",
    aspectRatio: 243 / 408,
    height: "100%",
    left: -SPACE.md,
    transform: [{ rotate: "-15deg" }],
  },
});
