import type { ReactNode } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

export type ModalCardProps = {
  visible: boolean;
  title: string;
  message: string;
  onRequestClose?: () => void;
  children: ReactNode;
};

export function ModalCard({ visible, title, message, onRequestClose, children }: ModalCardProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.scrim,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACE.xxl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.base,
    padding: SPACE.xl,
    gap: SPACE.sm,
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
