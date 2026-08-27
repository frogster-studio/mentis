import { StyleSheet, Text, View } from "react-native";
import { QuietButton } from "@/components/ui/quiet-button";
import { TEXT } from "@/theme/text";
import { COLORS, GUTTER, SPACE } from "@/theme/tokens";

const RETRY_LABEL = "Réessayer";

export interface ScreenErrorProps {
  message: string;
  onRetry: (() => void) | null;
}

export const ScreenError = ({ message, onRetry }: ScreenErrorProps) => {
  return (
    <View style={styles.root}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <QuietButton
          layout="block"
          label={RETRY_LABEL}
          icon={null}
          accessibilityLabel={null}
          onPress={onRetry}
          disabled={false}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: GUTTER,
    gap: SPACE.lg,
  },
  message: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
});
