import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { Toaster, toast } from "sonner-native";
import { useAppTabBarHeight } from "@/components/app-tab-bar";
import type { CommunityIconName } from "@/components/ui/icon-name";
import { Squircle } from "@/components/ui/squircle";
import { TEXT } from "@/theme/text";
import { COLORS, CONTROL_ICON_SIZE, GUTTER, RADIUS, SPACE } from "@/theme/tokens";

const TOAST_DURATION_MS = 4000;

const TOAST_ICON: CommunityIconName = "check-circle-outline";

interface ToastProps {
  message: string;
}

const Toast = ({ message }: ToastProps) => (
  <Squircle
    radius={RADIUS.base}
    corners="all"
    color={COLORS.face}
    borderColor={COLORS.ink}
    borderWidth={1}
    style={styles.surface}
  >
    <View style={styles.row}>
      <MaterialCommunityIcons name={TOAST_ICON} size={CONTROL_ICON_SIZE} color={COLORS.ink} />
      <Text style={styles.message}>{message}</Text>
    </View>
  </Squircle>
);

// Sonner renders a custom toast bare — no surface of its own — so every pixel here is the app's.
export const ToastHost = () => (
  <Toaster
    position="bottom-center"
    offset={useAppTabBarHeight() + SPACE.sm}
    duration={TOAST_DURATION_MS}
    swipeToDismissDirection="left"
    visibleToasts={1}
  />
);

export const showToast = (message: string) => {
  toast.custom(<Toast message={message} />);
};

const styles = StyleSheet.create({
  surface: {
    marginHorizontal: GUTTER,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    padding: SPACE.md,
  },
  message: {
    ...TEXT.body,
    color: COLORS.ink,
    flexShrink: 1,
  },
});
