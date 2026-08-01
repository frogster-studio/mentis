import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ModalCard } from '@/components/ui/modal-card';
import { COLORS } from '@/utils/colors';

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
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  confirmButton: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.strokeStrong,
    borderWidth: 1,
  },
  confirmLabel: {
    color: COLORS.fill,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: COLORS.primary,
  },
  cancelLabel: {
    color: COLORS.fillOpposite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
