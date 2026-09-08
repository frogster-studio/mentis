import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { awaitPremiumActivation } from "@/features/premium/api";
import {
  PREMIUM_RESTORE_EMPTY,
  PREMIUM_RESTORE_ERROR,
  PREMIUM_RESTORE_LABEL,
  PREMIUM_RESTORE_PENDING_LABEL,
} from "@/features/premium/constants";
import { isPremiumActive } from "@/features/premium/entitlement";
import { restorePurchases } from "@/lib/purchases";
import { TEXT } from "@/theme/text";
import { COLORS, PRESSED, SPACE } from "@/theme/tokens";

export const RestorePurchases = () => {
  const activation = useMutation({ mutationFn: awaitPremiumActivation });
  const restore = useMutation({
    mutationFn: restorePurchases,
    onSuccess: (info) => {
      if (isPremiumActive(info)) {
        activation.mutate();
      }
    },
  });

  // The wait on the server mirror is part of restoring, so both stages hold the one pending label.
  const isPending = restore.isPending || activation.isPending;
  const restoreFoundNothing = restore.isSuccess && !isPremiumActive(restore.data);

  return (
    <View style={styles.root}>
      {restore.isError ? <Text style={styles.error}>{PREMIUM_RESTORE_ERROR}</Text> : null}
      {restoreFoundNothing ? <Text style={styles.notice}>{PREMIUM_RESTORE_EMPTY}</Text> : null}
      <Pressable
        style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        disabled={isPending}
        onPress={() => restore.mutate()}
      >
        <Text style={styles.label}>
          {isPending ? PREMIUM_RESTORE_PENDING_LABEL : PREMIUM_RESTORE_LABEL}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: SPACE.xs,
  },
  action: {
    paddingVertical: SPACE.md,
    alignItems: "center",
  },
  label: {
    ...TEXT.body,
    color: COLORS.inkMuted,
  },
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
  notice: {
    ...TEXT.body,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  pressed: PRESSED,
});
