import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { type PropsWithChildren, useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

export { TrueSheetProvider as SheetProvider } from "@lodev09/react-native-true-sheet";

// iOS refuses a presentation while another sheet is still animating away, so each one waits its turn.
let lastDismissal: Promise<void> = Promise.resolve();

export interface SheetProps {
  visible: boolean;
  title: string | null;
  message: string | null;
  dismissible: boolean;
  isBare: boolean;
  onDismiss: () => void;
}

export const Sheet = ({
  visible,
  title,
  message,
  dismissible,
  isBare,
  onDismiss,
  children,
}: PropsWithChildren<SheetProps>) => {
  const sheet = useRef<TrueSheet>(null);
  const presented = useRef(false);
  const bottomInset = useSheetBottomInset();

  useEffect(() => {
    if (visible === presented.current) return;
    presented.current = visible;
    if (visible) {
      lastDismissal.then(() => {
        if (presented.current) {
          sheet.current?.present();
        }
      });
    } else {
      lastDismissal = sheet.current?.dismiss().catch(() => undefined) ?? Promise.resolve();
    }
  }, [visible]);

  return (
    <TrueSheet
      ref={sheet}
      detents={["auto"]}
      cornerRadius={isBare ? 0 : RADIUS.base}
      backgroundColor={isBare ? COLORS.clear : COLORS.card}
      grabber={!isBare}
      elevation={isBare ? 0 : undefined}
      dismissible={dismissible}
      maxContentWidth={MAX_CONTENT_WIDTH}
      onDidDismiss={() => {
        // Only an interactive dismissal lands here still presented; ours already told the caller.
        if (!presented.current) return;
        presented.current = false;
        onDismiss();
      }}
    >
      {/* A bare sheet draws no surface and owns its inset, so its scroll runs to the screen edge. */}
      {isBare ? (
        children
      ) : (
        <View style={[styles.content, { paddingBottom: bottomInset + SPACE.xl }]}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
        </View>
      )}
    </TrueSheet>
  );
};

// Android and web spend the bottom inset themselves; only iOS leaves it to the content.
export const useSheetBottomInset = () => {
  const insets = useSafeAreaInsets();
  return Platform.OS === "ios" ? insets.bottom : 0;
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.xl,
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
