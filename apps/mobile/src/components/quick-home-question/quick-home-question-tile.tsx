import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SquircleView } from "expo-squircle-view";
import { StyleSheet, Text, View } from "react-native";
import { QuickHomeQuestionChoiceButton } from "@/components/quick-home-question/quick-home-question-choice-button";
import { QuickHomeQuestionDots } from "@/components/quick-home-question/quick-home-question-dots";
import { iconNameOrFallback } from "@/components/ui/icon-name";
import {
  isCorrectChoice,
  type QuickHomeQuestionTile as Tile,
} from "@/features/quick-home-question/day-set";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, RADIUS, SPACE } from "@/theme/tokens";

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
  const { category } = question;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SquircleView
          borderRadius={RADIUS.sm}
          style={[styles.badge, { backgroundColor: category.color }]}
        >
          <MaterialIcons name={iconNameOrFallback(category.icon)} size={16} color={COLORS.ink} />
        </SquircleView>

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
  themeName: { ...TEXT.quickHomeQuestionThemeName, flex: 1, color: COLORS.ink },
  text: { ...TEXT.quickHomeQuestionText, color: COLORS.ink },
  choices: { flexDirection: "row", gap: SPACE.sm },
  badge: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
