import { StyleSheet, Text } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { POINTS_UNIT } from "@/features/quiz/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

export interface LeaderboardRowProps {
  rank: number;
  pseudo: string;
  seasonTotal: number;
  isMine: boolean;
}

export const LeaderboardRow = ({ rank, pseudo, seasonTotal, isMine }: LeaderboardRowProps) => {
  return (
    <Squircle
      radius={RADIUS.sm}
      corners="all"
      color={isMine ? COLORS.quiet : null}
      borderColor={null}
      borderWidth={null}
      style={styles.row}
    >
      <Text style={styles.rank}>{rank}</Text>
      <Text style={styles.pseudo} numberOfLines={1}>
        {pseudo}
      </Text>
      <Text style={styles.total}>{`${seasonTotal} ${POINTS_UNIT}`}</Text>
    </Squircle>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
  },
  rank: {
    ...TEXT.captionStrong,
    color: COLORS.inkMuted,
  },
  pseudo: {
    ...TEXT.body,
    flex: 1,
    color: COLORS.ink,
  },
  total: {
    ...TEXT.captionStrong,
    color: COLORS.ink,
  },
});
