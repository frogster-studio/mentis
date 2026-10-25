import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { QuickHomeQuestionStack } from "@/components/quick-home-question/quick-home-question-stack";
import { QuickHomeQuestionTile } from "@/components/quick-home-question/quick-home-question-tile";
import { QuickHomeQuestionTileSkeleton } from "@/components/quick-home-question/quick-home-question-tile-skeleton";
import { useQuickHomeQuestionDaySet } from "@/features/quick-home-question/api";
import {
  QUICK_HOME_QUESTION_COUNT,
  QUICK_HOME_QUESTION_FADE_MS,
  QUICK_HOME_QUESTION_HOLD_MS,
  QUICK_HOME_QUESTION_REVEAL_MS,
  QUICK_HOME_QUESTION_TAG,
  quickHomeQuestionCounterTag,
} from "@/features/quick-home-question/constants";
import { useQuickHomeQuestionStore } from "@/features/quick-home-question/store";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

const SKELETON_EDGE_COLORS = Array.from(
  { length: QUICK_HOME_QUESTION_COUNT - 1 },
  () => COLORS.card,
);

type Tap = { tileIndex: number; choice: string };

export const QuickHomeQuestionCard = () => {
  const { daySet, isPending } = useQuickHomeQuestionDaySet();
  const [tap, setTap] = useState<Tap | null>(null);

  useEffect(() => {
    if (tap === null) {
      return;
    }
    const timeout = setTimeout(
      () => setTap(null),
      QUICK_HOME_QUESTION_REVEAL_MS + QUICK_HOME_QUESTION_HOLD_MS,
    );
    return () => clearTimeout(timeout);
  }, [tap]);

  if (isPending) {
    return (
      <View style={styles.root}>
        <Text style={styles.tag}>{QUICK_HOME_QUESTION_TAG}</Text>
        <QuickHomeQuestionStack topColor={COLORS.card} edgeColors={SKELETON_EDGE_COLORS}>
          <QuickHomeQuestionTileSkeleton />
        </QuickHomeQuestionStack>
      </View>
    );
  }

  if (daySet === null) {
    return null;
  }

  // The store moves on at the tap; the tapped tile stays shown until its reveal is over.
  const shownIndex = tap?.tileIndex ?? daySet.results.length;
  const tile = daySet.tiles[shownIndex];
  if (tile === undefined) {
    return null;
  }

  const choose = (choice: string) => {
    setTap({ tileIndex: shownIndex, choice });
    useQuickHomeQuestionStore.getState().answer(choice);
  };

  return (
    <Animated.View entering={FadeIn.duration(QUICK_HOME_QUESTION_FADE_MS)} style={styles.root}>
      <Text style={styles.tag}>{quickHomeQuestionCounterTag(shownIndex, daySet.tiles.length)}</Text>
      <QuickHomeQuestionStack
        topColor={tile.question.category.color}
        edgeColors={daySet.tiles
          .slice(shownIndex + 1)
          .map((tileBeneath) => tileBeneath.question.category.color)}
      >
        <QuickHomeQuestionTile
          key={tile.question.id}
          tile={tile}
          position={shownIndex}
          total={daySet.tiles.length}
          tappedChoice={tap?.choice ?? null}
          onChoose={choose}
        />
      </QuickHomeQuestionStack>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { marginHorizontal: GUTTER, marginTop: GUTTER, gap: SPACE.sm },
  tag: { ...TEXT.label, color: COLORS.ink },
});
