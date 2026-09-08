import type { AppCompetitionLeaderboardPageResponse } from "@mentis/contracts/app";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { LeaderboardRow } from "@/features/world/components/leaderboard-row";
import { LEADERBOARD_EMPTY } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export interface LeaderboardListProps {
  entries: AppCompetitionLeaderboardPageResponse["entries"];
  myPseudo: string | null;
}

export const LeaderboardList = ({ entries, myPseudo }: LeaderboardListProps) => {
  if (entries.length === 0) {
    return (
      <Card onPress={null}>
        <Text style={styles.empty}>{LEADERBOARD_EMPTY}</Text>
      </Card>
    );
  }

  return (
    <Card onPress={null}>
      <View style={styles.rows}>
        {entries.map((entry) => (
          // A pseudo names one Account per Season, so the row it fills is its own.
          <LeaderboardRow
            key={entry.pseudo}
            rank={entry.rank}
            pseudo={entry.pseudo}
            seasonTotal={entry.seasonTotal}
            isMine={entry.pseudo === myPseudo}
          />
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  rows: {
    gap: SPACE.xxs,
  },
  empty: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
