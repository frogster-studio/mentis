import type { AppCompetitionLeaderboardPageResponse } from "@mentis/contracts/app";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import { Skeleton } from "@/components/ui/skeleton";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { LEADERBOARD_EMPTY } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";
import { MEDAL_IMAGE } from "@/utils/assets";

const SKELETON_ROWS = [0, 1, 2];
// « n° 12 » and « 120 pts »: typical widths, not the widest.
const RANK_SKELETON_WIDTH = 32;
const POINTS_SKELETON_WIDTH = 52;

export interface LeaderboardPreviewCardProps {
  entries: AppCompetitionLeaderboardPageResponse["entries"] | null;
  myPseudo: string | null;
  isFrozen: boolean;
  onPress: () => void;
}

export const LeaderboardPreviewCard = ({
  entries,
  myPseudo,
  isFrozen,
  onPress,
}: LeaderboardPreviewCardProps) => {
  return (
    <Pressable onPress={onPress}>
      <FastSquircleView style={styles.card}>
        <View style={styles.rows}>
          {entries === null ? (
            SKELETON_ROWS.map((index) => (
              <View key={index} style={[styles.row, { paddingLeft: index * 10 }]}>
                <Skeleton
                  radius={RADIUS.sm}
                  isOnDark
                  isFrozen={isFrozen}
                  style={styles.rankSkeleton}
                />
                <Skeleton
                  radius={RADIUS.sm}
                  isOnDark
                  isFrozen={isFrozen}
                  style={styles.pseudoSkeleton}
                />
                <Skeleton
                  radius={RADIUS.sm}
                  isOnDark
                  isFrozen={isFrozen}
                  style={styles.pointsSkeleton}
                />
              </View>
            ))
          ) : entries.length === 0 ? (
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
  rankSkeleton: { width: RANK_SKELETON_WIDTH, height: TEXT.captionStrong.lineHeight },
  pseudoSkeleton: { flex: 1, height: TEXT.body.lineHeight },
  pointsSkeleton: { width: POINTS_SKELETON_WIDTH, height: TEXT.captionStrong.lineHeight },
  empty: { ...TEXT.body, color: COLORS.face, paddingVertical: SPACE.xs },
  medal: {
    position: "absolute",
    aspectRatio: 237 / 393,
    height: "100%",
    left: SPACE.xxs,
    top: SPACE.lg,
    transform: [{ rotate: "-15deg" }],
  },
});
