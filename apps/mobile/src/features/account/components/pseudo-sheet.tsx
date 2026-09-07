import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import SquircleView from "react-native-fast-squircle";
import { NewButton } from "@/components/ui/new-button";
import { ScreenError } from "@/components/ui/screen-error";
import { ScreenLoading } from "@/components/ui/screen-loading";
import { Sheet } from "@/components/ui/sheet";
import { useProfile, useSetPseudo } from "@/features/account/api";
import {
  PSEUDO_ERROR,
  PSEUDO_LOAD_ERROR,
  PSEUDO_PLACEHOLDER,
  PSEUDO_RULE,
  PSEUDO_SUBMIT_LABEL,
  PSEUDO_TAKEN_ERROR,
  PSEUDO_TITLE,
} from "@/features/account/constants";
import { isValidPseudo } from "@/features/account/pseudo";
import { isApiError } from "@/lib/api/client";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_HEIGHT, RADIUS, SPACE } from "@/theme/tokens";

export interface PseudoSheetProps {
  playerId: string;
  visible: boolean;
  onDismiss: () => void;
}

export const PseudoSheet = ({ playerId, visible, onDismiss }: PseudoSheetProps) => {
  const profile = useProfile(playerId);
  const rename = useSetPseudo(playerId);
  const [draft, setDraft] = useState("");

  const current = profile.data?.pseudo ?? "";
  // Every opening starts from the stored pseudo, so an abandoned edit never survives the dismissal.
  useEffect(() => {
    if (visible) {
      setDraft(current);
    }
  }, [visible, current]);

  function close() {
    rename.reset();
    onDismiss();
  }

  return (
    <Sheet
      visible={visible}
      title={PSEUDO_TITLE}
      message={null}
      dismissible={!rename.isPending}
      onDismiss={close}
    >
      {profile.isPending ? (
        <ScreenLoading />
      ) : profile.isError ? (
        <ScreenError message={PSEUDO_LOAD_ERROR} onRetry={() => profile.refetch()} />
      ) : (
        <View style={styles.body}>
          <SquircleView style={styles.inputShell}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={PSEUDO_PLACEHOLDER}
              placeholderTextColor={COLORS.inkMuted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!rename.isPending}
              returnKeyType="done"
            />
          </SquircleView>

          {isValidPseudo(draft) ? null : <Text style={styles.rule}>{PSEUDO_RULE}</Text>}
          {rename.isError ? (
            <Text style={styles.error}>
              {isApiError(rename.error, "PSEUDO_TAKEN") ? PSEUDO_TAKEN_ERROR : PSEUDO_ERROR}
            </Text>
          ) : null}

          <NewButton
            layout="block"
            shape="rounded"
            tone="primary"
            label={PSEUDO_SUBMIT_LABEL}
            icon={null}
            accessibilityLabel={null}
            disabled={!isValidPseudo(draft)}
            pending={rename.isPending}
            onPress={() => rename.mutate(draft, { onSuccess: close })}
          />
        </View>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: SPACE.md,
    marginTop: SPACE.lg,
  },
  inputShell: {
    borderWidth: 1,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.face,
    borderColor: COLORS.ink,
    height: CONTROL_HEIGHT,
    justifyContent: "center",
  },
  input: {
    height: "100%",
    paddingHorizontal: SPACE.lg,
    ...TEXT.body,
    color: COLORS.ink,
  },
  rule: {
    ...TEXT.caption,
    color: COLORS.inkMuted,
    textAlign: "center",
  },
  error: {
    ...TEXT.body,
    color: COLORS.danger,
    textAlign: "center",
  },
});
