import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { type PropsWithChildren, useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { TEXT } from "@/theme/text";
import { COLORS, RADIUS, SPACE } from "@/theme/tokens";

export { TrueSheetProvider as SheetProvider } from "@lodev09/react-native-true-sheet";

export interface SheetProps {
  visible: boolean;
  title: string | null;
  message: string | null;
  dismissible: boolean;
  onDismiss: () => void;
}

export const Sheet = ({
  visible,
  title,
  message,
  dismissible,
  onDismiss,
  children,
}: PropsWithChildren<SheetProps>) => {
  const sheet = useRef<TrueSheet>(null);
  const presented = useRef(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible === presented.current) return;
    presented.current = visible;
    if (visible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [visible]);

  // Android and web spend the bottom inset themselves; only iOS leaves it to the content.
  const bottomInset = Platform.OS === "ios" ? insets.bottom : 0;

  return (
    <TrueSheet
      ref={sheet}
      detents={["auto"]}
      cornerRadius={RADIUS.base}
      backgroundColor={COLORS.card}
      dismissible={dismissible}
      maxContentWidth={MAX_CONTENT_WIDTH}
      onDidDismiss={() => {
        // Only an interactive dismissal lands here still presented; ours already told the caller.
        if (!presented.current) return;
        presented.current = false;
        onDismiss();
      }}
    >
      <View style={[styles.content, { paddingBottom: bottomInset + SPACE.xl }]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {children}
      </View>
    </TrueSheet>
  );
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
