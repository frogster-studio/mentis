import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogoWordmark } from "@/components/logo-wordmark";
import { BlurBand } from "@/components/ui/blur-band";
import { useAuthStore } from "@/features/account/auth-store";
import { ACCOUNT_TITLE } from "@/features/account/constants";
import { COLORS, GUTTER, PRESSED, SPACE } from "@/theme/tokens";

const PROFILE_ICON_SIZE = 32;
const WORDMARK_WIDTH = 92;
const HEADER_ROW_HEIGHT = PROFILE_ICON_SIZE + SPACE.md * 2;

// The band reaches under the status bar, so content clears the inset as well as the row.
export function useAppHeaderHeight() {
  return useSafeAreaInsets().top + HEADER_ROW_HEIGHT;
}

export function AppHeader() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const insets = useSafeAreaInsets();

  return (
    <BlurBand edge="top">
      <View
        style={[styles.row, { height: HEADER_ROW_HEIGHT + insets.top, paddingTop: insets.top }]}
      >
        <LogoWordmark color={COLORS.ink} width={WORDMARK_WIDTH} />
        <Pressable
          style={({ pressed }) => pressed && styles.pressed}
          onPress={() => router.push("/account")}
          accessibilityLabel={ACCOUNT_TITLE}
          hitSlop={8}
        >
          <MaterialIcons
            name="account-circle"
            size={PROFILE_ICON_SIZE}
            color={session ? COLORS.primary : COLORS.ink}
          />
        </Pressable>
      </View>
    </BlurBand>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    pointerEvents: "box-none",
  },
  pressed: PRESSED,
});
