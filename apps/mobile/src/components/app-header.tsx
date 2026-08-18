import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { CircleUser } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoWordmark } from "@/components/logo-wordmark";
import { MAX_CONTENT_WIDTH } from "@/components/ui/screen-container";
import { useAuthStore } from "@/features/account/auth-store";
import { ACCOUNT_TITLE } from "@/features/account/constants";
import { COLORS, GUTTER, PRESSED, SPACE } from "@/theme/tokens";

const PROFILE_ICON_SIZE = 32;
const WORDMARK_WIDTH = 140;
const BLUR_INTENSITY = 40;
const HEADER_ROW_HEIGHT = PROFILE_ICON_SIZE + SPACE.md * 2;
// Android below 12 renders no blur, so the wash goes opaque and the band degrades flat.
const WASH_OPACITY = Platform.OS === "android" && Number(Platform.Version) < 31 ? 1 : 0.7;

// The band reaches under the status bar, so content clears the inset as well as the row.
export function useAppHeaderHeight() {
  return useSafeAreaInsets().top + HEADER_ROW_HEIGHT;
}

export function AppHeader() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.overlay}>
      <BlurView
        intensity={BLUR_INTENSITY}
        tint="light"
        blurMethod="dimezisBlurViewSdk31Plus"
        style={[styles.band, { paddingTop: insets.top }]}
      >
        {/* Keeps the wordmark legible against whatever scrolls under the blur. */}
        <View style={[StyleSheet.absoluteFill, styles.wash]} />
        <View style={styles.row}>
          <LogoWordmark color={COLORS.ink} width={WORDMARK_WIDTH} />
          <Pressable
            style={({ pressed }) => pressed && styles.pressed}
            onPress={() => router.push("/account")}
            accessibilityLabel={ACCOUNT_TITLE}
            hitSlop={8}
          >
            <CircleUser size={PROFILE_ICON_SIZE} color={session ? COLORS.primary : COLORS.ink} />
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  band: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    pointerEvents: "box-none",
  },
  wash: {
    backgroundColor: COLORS.background,
    opacity: WASH_OPACITY,
    pointerEvents: "none",
  },
  row: {
    height: HEADER_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    pointerEvents: "box-none",
  },
  pressed: PRESSED,
});
