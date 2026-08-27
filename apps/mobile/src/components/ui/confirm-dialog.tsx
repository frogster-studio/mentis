import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/button";
import { QuietButton } from "@/components/ui/quiet-button";
import { Sheet } from "@/components/ui/sheet";
import { SPACE } from "@/theme/tokens";

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
      title={title}
      message={message}
      dismissible={true}
      onDismiss={onCancel}
    >
      {/* The destructive action takes the quiet slot, so the emphasis never invites the damage. */}
      <View style={styles.actions}>
        <Button label={cancelLabel} onPress={onCancel} pending={false} />
        <QuietButton
          layout="block"
          label={confirmLabel}
          icon={null}
          accessibilityLabel={null}
          onPress={onConfirm}
          disabled={false}
        />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  actions: {
    gap: SPACE.md,
    marginTop: SPACE.lg,
  },
});
