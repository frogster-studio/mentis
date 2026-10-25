import { StyleSheet, Text, View } from "react-native";
import { CategoryBadge } from "@/components/category-badge";
import { QuickHomeQuestionChoiceButton } from "@/components/quick-home-question/quick-home-question-choice-button";
import { QuickHomeQuestionDots } from "@/components/quick-home-question/quick-home-question-dots";
import {
  isCorrectChoice,
  type QuickHomeQuestionTile as Tile,
} from "@/features/quick-home-question/day-set";
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

export interface QuickHomeQuestionTileProps {
  tile: Tile;
  position: number;
  total: number;
  tappedChoice: string | null;
  onChoose: (choice: string) => void;
}

export const QuickHomeQuestionTile = ({
  tile,
  position,
  total,
  tappedChoice,
  onChoose,
}: QuickHomeQuestionTileProps) => {
  const { question } = tile;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {/* The white badge face, or the icon would sink into the tile's own Category colour. */}
        <CategoryBadge category={question.category} isSelected />
        <Text style={styles.themeName} numberOfLines={1}>
          {question.themeName}
        </Text>
      </View>
      <Text style={styles.text}>{question.text}</Text>
      <View style={styles.choices}>
        {tile.choices.map((choice) => (
          <QuickHomeQuestionChoiceButton
            key={choice}
            label={choice}
            revealsCorrect={tappedChoice !== null && isCorrectChoice(tile, choice)}
            revealsMistake={tappedChoice === choice && !isCorrectChoice(tile, choice)}
            disabled={tappedChoice !== null}
            onPress={() => onChoose(choice)}
          />
        ))}
      </View>
      <QuickHomeQuestionDots position={position} total={total} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: SPACE.md },
  header: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  themeName: { ...TEXT.label, flex: 1, color: COLORS.ink },
  text: { ...TEXT.cardTitle, color: COLORS.ink },
  choices: { flexDirection: "row", gap: SPACE.sm },
});
