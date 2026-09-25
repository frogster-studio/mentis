import { Pressable, StyleSheet, Text, View } from "react-native";
import { NewButton } from "@/components/ui/new-button";
import { Sheet } from "@/components/ui/sheet";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, PRESSED, SPACE } from "@/theme/tokens";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <Sheet
      visible={visible}
      isBare={false}
      title={title}
      message={message}
      dismissible={true}
      onDismiss={onCancel}
    >
      {/* The destructive action takes the quiet slot, so the emphasis never invites the damage. */}
      <View style={styles.actions}>
        <NewButton
          onPress={onCancel}
          layout="block"
          shape="full"
          tone="gradient-primary"
          disabled={false}
          pending={false}
          icon={null}
          label={cancelLabel}
          accessibilityLabel={null}
        />
        <Pressable
          onPress={onConfirm}
          accessibilityRole="button"
          style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
        >
          <Text style={styles.confirmLabel}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  actions: {
    marginTop: SPACE.lg,
  },
  confirm: {
    height: CONTROL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLabel: {
    ...TEXT.label,
    color: COLORS.danger,
  },
  pressed: PRESSED,
});
