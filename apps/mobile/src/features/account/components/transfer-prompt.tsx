import { useMutation } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { ModalCard } from "@/components/ui/modal-card";
import { QuietButton } from "@/components/ui/quiet-button";
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
import { TEXT } from "@/theme/text";
import { COLORS, SPACE } from "@/theme/tokens";

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
        <Button label={TRANSFER_ACCEPT_LABEL} onPress={onAccept} pending={transfer.isPending} />
        <QuietButton
          label={TRANSFER_DECLINE_LABEL}
          onPress={decline}
          disabled={transfer.isPending}
        />
      </View>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
  actions: {
    gap: SPACE.md,
    marginTop: SPACE.lg,
  },
});
