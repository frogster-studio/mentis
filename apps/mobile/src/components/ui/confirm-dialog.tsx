import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/button";
import { ModalCard } from "@/components/ui/modal-card";
import { QuietButton } from "@/components/ui/quiet-button";
import { SPACE } from "@/theme/tokens";

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ModalCard
      visible={visible}
      title={title}
      message={message}
      onRequestClose={onCancel}
      onBackdropPress={onCancel}
    >
      {/* The destructive action takes the quiet slot, so the emphasis never invites the damage. */}
      <View style={styles.actions}>
        <QuietButton layout="flex" label={confirmLabel} onPress={onConfirm} />
        <Button layout="flex" label={cancelLabel} onPress={onCancel} />
      </View>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE.md,
    marginTop: SPACE.lg,
  },
});
