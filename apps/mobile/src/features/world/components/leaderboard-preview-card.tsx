import type { AppCompetitionLeaderboardPageResponse } from "@mentis/contracts/app";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Squircle } from "@/components/ui/squircle";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { LEADERBOARD_EMPTY, LEADERBOARD_OPEN_LABEL } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_SQUARE_SIZE, RADIUS, SPACE } from "@/theme/tokens";

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
    <View>
      <Card
        onPress={onPress}
        background={
          <Squircle
            radius={RADIUS.base}
            corners="all"
            color={COLORS.ink}
            borderColor={null}
            borderWidth={null}
            style={StyleSheet.absoluteFill}
          >
            <Squircle
              radius={RADIUS.base}
              corners="all"
              color={`${COLORS.face}26`}
              borderColor={null}
              borderWidth={null}
              style={StyleSheet.absoluteFill}
            />
          </Squircle>
        }
      >
        <View style={styles.rows}>
          {entries.length === 0 ? (
            <Text style={styles.empty}>{LEADERBOARD_EMPTY}</Text>
          ) : (
            entries.map((entry) => (
              <Squircle
                key={entry.pseudo}
                radius={RADIUS.sm}
                corners="all"
                color={entry.pseudo === myPseudo ? `${COLORS.face}1A` : null}
                borderColor={null}
                borderWidth={null}
                style={styles.row}
              >
                <Text style={styles.rank}>{entry.rank}</Text>
                <Text style={styles.pseudo} numberOfLines={1}>
                  {entry.pseudo}
                </Text>
                <Text style={styles.points}>
                  {entry.seasonTotal} {POINTS_UNIT}
                </Text>
              </Squircle>
            ))
          )}
          <Text style={styles.link}>{LEADERBOARD_OPEN_LABEL}</Text>
        </View>
      </Card>
      <Image
        source={require("../../../../assets/images/competition/medal.png")}
        contentFit="contain"
        style={styles.medal}
        pointerEvents="none"
        accessible={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rows: { marginVertical: -SPACE.sm, marginHorizontal: -SPACE.sm, paddingLeft: SPACE.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.xs,
  },
  rank: { ...TEXT.captionStrong, color: COLORS.face },
  pseudo: { ...TEXT.body, color: COLORS.face, flex: 1 },
  points: { ...TEXT.captionStrong, color: COLORS.face },
  empty: { ...TEXT.body, color: COLORS.face, paddingVertical: SPACE.xs },
  link: { ...TEXT.caption, color: COLORS.face, textAlign: "right", paddingTop: SPACE.xs },
  medal: {
    position: "absolute",
    width: CONTROL_SQUARE_SIZE,
    height: CONTROL_SQUARE_SIZE + SPACE.xl,
    left: -SPACE.xs,
    top: SPACE.lg,
    transform: [{ rotate: "-15deg" }],
  },
});
