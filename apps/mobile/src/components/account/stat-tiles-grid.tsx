import { StyleSheet, View } from "react-native";
import { StatFigure } from "@/components/account/stat-figure";
import { StatTile } from "@/components/account/stat-tile";
import {
  STATS_AVERAGE_TITLE,
  STATS_GAMES_TITLE,
  STATS_LONGEST_STREAK_TITLE,
  STATS_RANK_TITLE,
} from "@/features/account/constants";
import { countFigure, rankFigure, scoreFigure } from "@/features/account/stat-figures";
import type { StatTiles } from "@/features/quiz/theme-tallies";
import { SPACE } from "@/theme/tokens";

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
          <StatFigure
            value={countFigure(longestCompetitionStreak)}
            isCompetition={true}
            opensSignIn={isSignedOut}
          />
        </StatTile>
      </View>
      <View style={styles.row}>
        <StatTile title={STATS_AVERAGE_TITLE} hasFlame={false}>
          <StatFigure
            value={scoreFigure(tiles.overallAverage)}
            isCompetition={false}
            opensSignIn={false}
          />
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
});
