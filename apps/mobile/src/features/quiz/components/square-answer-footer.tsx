import { StyleSheet, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { SquareButton } from "@/features/quiz/components/square-button";
import { CONFIRM_LABEL } from "@/features/quiz/constants";
import { GUTTER, SPACE } from "@/theme/tokens";

export interface SquareAnswerFooterProps {
  choices: string[];
  selection: number | null;
  categoryColor: string;
  disabled: boolean;
  onSelect: (index: number) => void;
  onConfirm: () => void;
}

export const SquareAnswerFooter = ({
  choices,
  selection,
  categoryColor,
  disabled,
  onSelect,
  onConfirm,
}: SquareAnswerFooterProps) => {
  return (
    <View style={styles.footer}>
      <View style={styles.grid}>
        {choices.map((choice, index) => (
          <SquareButton
            key={choice}
            label={choice}
            color={categoryColor}
            selected={selection === index}
            onPress={() => onSelect(index)}
          />
        ))}
      </View>
      <NewButton
        layout="block"
        shape="full"
        tone="primary"
        icon="check"
        label={CONFIRM_LABEL}
        accessibilityLabel={null}
        onPress={onConfirm}
        disabled={disabled}
        pending={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    gap: SPACE.xxl,
    paddingHorizontal: GUTTER + SPACE.lg,
    paddingBottom: SPACE.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACE.lg,
  },
});
