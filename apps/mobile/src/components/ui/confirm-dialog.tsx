import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/utils/colors";

// Shared confirmation dialog: a React Native Modal (not Alert) so it renders identically on web
// and mobile. The confirm action is kept subdued — it is the one that leaves or discards —
// while cancelling sits on the filled primary button as the encouraged default. Tapping the
// scrim dismisses (same as cancel).
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* Tap the scrim to dismiss; the inner Pressable swallows taps on the card. */}
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.pressed,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
              onPress={onCancel}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.scrim,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  title: {
    color: COLORS.fill,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  message: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  // The confirm (leaving/discarding) action is kept subdued; cancelling is the encouraged default.
  confirmButton: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.strokeStrong,
    borderWidth: 1,
  },
  confirmLabel: {
    color: COLORS.fill,
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: COLORS.primary,
  },
  cancelLabel: {
    color: COLORS.fillOpposite,
    fontSize: 16,
    fontWeight: "bold",
  },
});
