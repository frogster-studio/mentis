import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { QuickHomeQuestionChoiceButton } from "@/components/quick-home-question/quick-home-question-choice-button";
import { useQuickHomeQuestionDaySet } from "@/features/quick-home-question/api";
import {
  QUICK_HOME_QUESTION_HOLD_MS,
  QUICK_HOME_QUESTION_REVEAL_MS,
  quickHomeQuestionCounterTag,
} from "@/features/quick-home-question/constants";
import { isCorrectChoice } from "@/features/quick-home-question/day-set";
import { useQuickHomeQuestionStore } from "@/features/quick-home-question/store";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

type Tap = { tileIndex: number; choice: string };

export const QuickHomeQuestionCard = () => {
  const { daySet } = useQuickHomeQuestionDaySet();
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
    <View style={styles.root}>
      <Text style={styles.tag}>{quickHomeQuestionCounterTag(shownIndex, daySet.tiles.length)}</Text>
      <View key={tile.question.id} style={styles.choices}>
        {tile.choices.map((choice) => (
          <QuickHomeQuestionChoiceButton
            key={choice}
            label={choice}
            revealsCorrect={tap !== null && isCorrectChoice(tile, choice)}
            revealsMistake={tap?.choice === choice && !isCorrectChoice(tile, choice)}
            disabled={tap !== null}
            onPress={() => choose(choice)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: SPACE.sm },
  tag: { ...TEXT.label, color: COLORS.ink },
  choices: { flexDirection: "row", gap: SPACE.sm },
});
