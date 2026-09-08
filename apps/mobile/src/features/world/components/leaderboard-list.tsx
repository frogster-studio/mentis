import type { AppCompetitionLeaderboardPageResponse } from "@mentis/contracts/app";
import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Squircle } from "@/components/ui/squircle";
import { LeaderboardRow } from "@/features/world/components/leaderboard-row";
import { LEADERBOARD_EMPTY } from "@/features/world/constants";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

export interface LeaderboardListProps {
  entries: AppCompetitionLeaderboardPageResponse["entries"];
  myPseudo: string | null;
}

export const LeaderboardList = ({ entries, myPseudo }: LeaderboardListProps) => {
  if (entries.length === 0) {
    return (
      <Surface>
        <Text style={styles.empty}>{LEADERBOARD_EMPTY}</Text>
      </Surface>
    );
  }

  return (
    <Surface>
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
    </Surface>
  );
};

const Surface = ({ children }: PropsWithChildren) => (
  <Squircle
    radius={RADIUS.base}
    corners="all"
    color={COLORS.background}
    borderColor={null}
    borderWidth={null}
    style={styles.surface}
  >
    {children}
  </Squircle>
);

const styles = StyleSheet.create({
  surface: {
    padding: SPACE.lg,
  },
  rows: {
    gap: SPACE.xxs,
  },
  empty: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
