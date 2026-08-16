import { useMutation } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ModalCard } from "@/components/ui/modal-card";
import { useAuthStore } from "@/features/account/auth-store";
import {
  TRANSFER_ACCEPT_LABEL,
  TRANSFER_DECLINE_LABEL,
  TRANSFER_ERROR,
  TRANSFER_MESSAGE,
  TRANSFER_TITLE,
} from "@/features/account/constants";
import { useStatsStore } from "@/features/quiz/stats-store";
import { shouldOfferTransfer } from "@/features/quiz/stats-transfer";
import { useTransferStore } from "@/features/quiz/transfer-store";
import { transferDeviceStats } from "@/features/quiz/transfer-sync";
import { COLORS } from "@/utils/colors";

export function TransferPrompt() {
  const playerId = useAuthStore((state) => state.session?.user.id);
  const deviceStats = useStatsStore((state) => state.stats);
  const dormant = useTransferStore((state) => state.dormant);
  const transferred = useTransferStore((state) => state.transferred);
  const decline = useTransferStore((state) => state.decline);
  // Success empties the device world, the predicate flips false, and this modal closes itself.
  const transfer = useMutation({ mutationFn: transferDeviceStats });

  const visible = playerId !== undefined && shouldOfferTransfer(deviceStats, dormant, transferred);

  const onAccept = () => {
    if (playerId === undefined) {
      return;
    }
    transfer.mutate(playerId);
  };

  return (
    <ModalCard
      visible={visible}
      title={TRANSFER_TITLE}
      message={TRANSFER_MESSAGE}
      // Android back is a reversible decline, never a silent accept — ignored mid-push.
      onRequestClose={transfer.isPending ? undefined : decline}
    >
      {transfer.isError ? <Text style={styles.error}>{TRANSFER_ERROR}</Text> : null}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.button, styles.acceptButton, pressed && styles.pressed]}
          disabled={transfer.isPending}
          onPress={onAccept}
        >
          {transfer.isPending ? (
            <ActivityIndicator color={COLORS.fillOpposite} />
          ) : (
            <Text style={styles.acceptLabel}>{TRANSFER_ACCEPT_LABEL}</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, styles.declineButton, pressed && styles.pressed]}
          disabled={transfer.isPending}
          onPress={decline}
        >
          <Text style={styles.declineLabel}>{TRANSFER_DECLINE_LABEL}</Text>
        </Pressable>
      </View>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  error: {
    color: COLORS.red500,
    fontSize: 14,
    textAlign: "center",
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  acceptLabel: {
    color: COLORS.fillOpposite,
    fontSize: 16,
    fontWeight: "bold",
  },
  declineButton: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.strokeStrong,
    borderWidth: 1,
  },
  declineLabel: {
    color: COLORS.fill,
    fontSize: 16,
    fontWeight: "bold",
  },
});
