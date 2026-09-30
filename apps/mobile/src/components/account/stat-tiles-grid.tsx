import { StyleSheet, Text, View } from "react-native";
import { StatFigure } from "@/components/account/stat-figure";
import { StatTile } from "@/components/account/stat-tile";
import {
  STATS_AVERAGE_TITLE,
  STATS_GAMES_TITLE,
  STATS_LONGEST_STREAK_TITLE,
  STATS_RANK_TITLE,
} from "@/features/account/constants";
import { countFigure, rankFigure, scoreFigure } from "@/features/account/stat-figures";
import { RESULTS_SCORE_MAX_LABEL } from "@/features/quiz/constants";
import type { StatTiles } from "@/features/quiz/theme-tallies";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export interface StatTilesGridProps {
  tiles: StatTiles;
  longestPracticeStreak: number;
  longestCompetitionStreak: number | null;
  rank: number | null;
  isSignedOut: boolean;
}

export const StatTilesGrid = ({
  tiles,
  longestPracticeStreak,
  longestCompetitionStreak,
  rank,
  isSignedOut,
}: StatTilesGridProps) => {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        <StatTile title={STATS_GAMES_TITLE} hasFlame={false}>
          <StatFigure
            value={countFigure(tiles.practiceGames)}
            isCompetition={false}
            opensSignIn={false}
          />

          <View style={styles.divider} />

          <StatFigure
            value={countFigure(tiles.competitionGames)}
            isCompetition={true}
            opensSignIn={isSignedOut}
          />
        </StatTile>

        <StatTile title={STATS_LONGEST_STREAK_TITLE} hasFlame={true}>
          <StatFigure
            value={countFigure(longestPracticeStreak)}
            isCompetition={false}
            opensSignIn={false}
          />

          <View style={styles.divider} />

          <StatFigure
            value={countFigure(longestCompetitionStreak)}
            isCompetition={true}
            opensSignIn={isSignedOut}
          />
        </StatTile>
      </View>

      <View style={styles.row}>
        <StatTile title={STATS_AVERAGE_TITLE} hasFlame={false}>
          <View style={styles.statTextContainer}>
            <Text style={styles.statText}>{scoreFigure(tiles.overallAverage)[0]}</Text>
            <Text style={{ ...TEXT.caption, color: COLORS.inkMuted }}>
              {RESULTS_SCORE_MAX_LABEL}
            </Text>
          </View>
        </StatTile>

        <StatTile title={STATS_RANK_TITLE} hasFlame={false}>
          <StatFigure value={rankFigure(rank)} isCompetition={true} opensSignIn={isSignedOut} />
        </StatTile>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { gap: SPACE.md },
  row: { flexDirection: "row", gap: SPACE.md },
  divider: { height: "100%", width: 1, backgroundColor: COLORS.background },
  statText: { ...TEXT.statText, color: COLORS.ink },
  statTextContainer: { flexDirection: "row", alignItems: "baseline", gap: SPACE.xxs },
});
