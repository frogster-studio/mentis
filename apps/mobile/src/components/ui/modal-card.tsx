import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS } from "@/theme/tokens";

export type ModalCardProps = {
  visible: boolean;
  title: string;
  message: string;
  onRequestClose?: () => void;
  onBackdropPress?: () => void;
  children: ReactNode;
};

export function ModalCard({
  visible,
  title,
  message,
  onRequestClose,
  onBackdropPress,
  children,
}: ModalCardProps) {
  const body = (
    <>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {children}
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      {onBackdropPress ? (
        <Pressable style={styles.backdrop} onPress={onBackdropPress}>
          <Pressable style={styles.card} onPress={() => {}}>
            {body}
          </Pressable>
        </Pressable>
      ) : (
        <View style={styles.backdrop}>
          <View style={styles.card}>{body}</View>
        </View>
      )}
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
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    padding: 24,
    gap: 8,
  },
  title: {
    ...TEXT.cardTitle,
    color: COLORS.ink,
    textAlign: "center",
  },
  message: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
});
